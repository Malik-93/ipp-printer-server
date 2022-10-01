import express, { Request, Response, Application } from 'express'
import path from 'path'
import logger from './logger'
import upload from './multer'
import fs from 'fs'
import cors from 'cors'
import dotenv from 'dotenv'
import { FullRequest, Printer } from 'ipp'
import { unlinkFile } from './utils'
import http from 'http';

import { networkInterfaces } from 'os';

const nets = networkInterfaces();
let networkIP = '';

for (const name of Object.keys(nets)) {
  // @ts-ignore
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
    if (net.family === familyV4Value && !net.internal) {
      networkIP = net.address
    }
  }
}
console.log('networkIP', networkIP);

// import localtunnel from 'localtunnel';

// (async () => {
//   const tunnel = await localtunnel({ port: 9000 });
//   console.log('tunnel', tunnel.url);
//   // the assigned public url for your tunnel
//   // i.e. https://abcdefgjhij.localtunnel.me
//   tunnel.url;

//   tunnel.on('close', () => {
//     // tunnels are closed
//   });
// })();
// import net from 'net'
// @ts-ignore
// console.log(net.);
// @ts-ignore

// console.log(net.isIPv4());
// @ts-ignore

// console.log(net.isIPv6());

dotenv.config()
const app: Application = express()
const port: number = Number(process.env.PORT) || 9000
app.get('/', function (req: Request, res: Response) {
  return res.status(200).json({ active: true, message: 'Printer server is up' })
})
app.use(cors());
// Add headers before the routes are defined
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', `http://${networkIP}:${port}`);

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  // Pass to next layer of middleware
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))) //  "public" off of current is root
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.post(
  '/print',
  upload('uploads').single('file'),
  async (req: Request, res: Response) => {
    console.log('RAN ====================================');
    //@ts-ignore
    const filePath = `${req.file.path}`
    // const printCount = req.body.copies
    const printCount = req.body?.copies === 'undefined' ? 1 : req.body?.copies
    console.log('printCount', printCount)
    try {
      // console.log('filePath', filePath);
      fs.readFile(filePath, function (err: Error | any, data: Buffer) {
        if (err) throw err

        const printer = new Printer(process.env.PRINTER_URL || '')
        const msg: FullRequest = {
          'job-attributes-tag': {
            copies: printCount,
          },
          'operation-attributes-tag': {
            'requesting-user-name': 'Azure',
            'job-name': 'Automatic Print Job',
            'document-format': 'application/pdf',
          },
          data: data,
        }
        //@ts-ignore
        printer.execute('Print-Job', msg, function (err: Error, _res: any) {
          unlinkFile(filePath)
          if (err) {
            console.log(err)
            return res
              .status(500)
              .json({ success: false, message: 'An error accured :', err })
          }
          console.log(_res)
          return res
            .status(200)
            .json({ success: true, message: 'Request has been sent to printer...', _res })
        })
      })

    } catch (error) {
      console.log(`Print error -> ${JSON.stringify(error)}`)
      logger.error(`Print error -> ${JSON.stringify(error)}`)
      unlinkFile(filePath)
      return res
        .status(500)
        .json({ success: false, message: 'Ooops! Something went wrong...' })
    }
  },
)
const server = http.createServer(app)
server.listen(port, `${networkIP}`, undefined, () => {
  console.log(`${process.env.PROJECT} is listening on http://${networkIP}:${port}`)
  logger.info(`${process.env.PROJECT} is listening on http://${networkIP}:${port}`)
})

export default server
