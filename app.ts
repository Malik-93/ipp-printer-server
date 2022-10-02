import express, { Request, Response, Application } from 'express'
import path from 'path'
import logger from './logger'
import upload from './multer'
import fs from 'fs'
import cors from 'cors'
import dotenv from 'dotenv'
import { FullRequest, Printer } from 'ipp'
import { unlinkFile, get_network_ipv4 } from './utils'
import http from 'http';
import https from 'https';




dotenv.config()
const app: Application = express()
const port: number = Number(process.env.PORT) || 9000
app.use(cors());
app.get('/', function (req: Request, res: Response) {
  return res.status(200).json({ active: true, message: 'Printer server is up' })
})
app.get('/get_remote_ipv4', function (req: Request, res: Response) {
  let ipv4 = req.socket.remoteAddress;
  // console.log('__SOCKET__', req.socket.address());
  // console.log('__IPV4__', ipv4);
  var client_local_ip = req.headers["x-forwarded-for"];
  console.log('__client_local_ip__', client_local_ip);

  return res.status(200).json({ active: true, message: 'Printer server is up', ip_info: { ...req.socket.address(), client_local_ip } })
})
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))) //  "public" off of current is root
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.post(
  '/print',
  upload('uploads').single('file'),
  async (req: Request, res: Response) => {
    console.log('__RAN__');
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
            console.log('__Error__', err)
            return res
              .status(200)
              .json({ success: false, statusCode: 500, Error: `${err}` })
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
        .status(200)
        .json({ success: false, statusCode: 500, message: 'Ooops! Something went wrong...' })
    }
  },
)

let server = http.createServer(app);
if (process.env.NODE_ENV === 'development') {
  let networkIP = get_network_ipv4();
  const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
  }
  server = https.createServer(httpsOptions, app)
  server.listen(port, `${networkIP}`, undefined, () => {
    console.log(`${process.env.PROJECT} is listening on https://${networkIP}:${port}`)
    logger.info(`${process.env.PROJECT} is listening on https://${networkIP}:${port}`)
  })
} else {
  server = http.createServer(app)
  server.listen(port, () => {
    console.log(`${process.env.PROJECT} is listening at PORT ${port}`)
    logger.info(`${process.env.PROJECT} is listening at PORT ${port}`)
  })
}

export default server
