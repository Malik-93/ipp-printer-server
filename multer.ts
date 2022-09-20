import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express'
const multer = require('multer');
interface IFile {
    fieldname?: string,
    originalname?: string | any,
}

const storage = (dirPath: string = 'uploads') => multer.diskStorage({
    destination: (req: Request, file: IFile, next: (error: any, dirPath: string) => void) => {
        fs.exists(dirPath, (exist) => {
            if (exist) {
                next(null, dirPath)
            } else {
                fs.mkdir(dirPath, err => {
                    if (!err) {
                        next(null, dirPath);
                    }
                })
            }
        })
    },
    filename: (req: Request, file: IFile, next: (error: any, dirPath: string) => void) => {
        var hash = `${crypto.randomBytes(20).toString('hex')}`;
        next(null, file.fieldname + '-' + hash + path.extname(file.originalname));
    }
})
const upload = (dirName: string = 'uploads') => multer({
    storage: storage(dirName),
});

export default upload;