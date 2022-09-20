import express, {Request, Response, Application} from 'express'
import path from 'path'
import logger from './logger'
import upload from './multer'
import fs from 'fs'
import cors from 'cors'
import dotenv from 'dotenv'
import {FullRequest, Printer} from 'ipp'
import {unlinkFile} from './utils'
dotenv.config()
const app: Application = express()
const port: string | number = process.env.PORT || 9000
app.get('/', function (req: Request, res: Response) {
  return res.status(200).json({active: true, message: 'Printer server is up'})
})
app.use(cors())
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))) //  "public" off of current is root
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.post(
  '/print',
  upload('uploads').single('file'),
  async (req: Request, res: Response) => {
    //@ts-ignore
    const filePath = `${req.file.path}`
    // const printCount = req.body.copies
    const printCount = req.body?.copies === 'undefined' ? 1 : req.body?.copies
    console.log(printCount)
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
        printer.execute('Print-Job', msg, function (err: Error, res: any) {
          if (err) console.log(err)
          console.log(res)
        })
      })
      unlinkFile(filePath)
      return res
        .status(200)
        .json({success: true, message: 'Request has been sent to printer...'})
    } catch (error) {
      console.log(`Print error -> ${JSON.stringify(error)}`)
      logger.error(`Print error -> ${JSON.stringify(error)}`)
      unlinkFile(filePath)
      return res
        .status(500)
        .json({success: false, message: 'Ooops! Something went wrong...'})
    }
  },
)
app.listen(port, async () => {
  console.log(`${process.env.PROJECT} is listening on http://localhost:${port}`)
  logger.info(`${process.env.PROJECT} is listening on http://localhost:${port}`)
})
export default app
