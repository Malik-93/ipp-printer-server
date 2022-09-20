import fs from 'fs';
import logger from '../logger';
export const unlinkFile = (filePath: string) => {
    fs.unlink(filePath, (err: Error | any) => {
        if (err) {
            console.log(`An error accured while deleting the ${filePath} file ..`)
            logger.error(`An error accured while deleting the ${filePath} file ..`)
        }
        else {
            console.log(`${filePath} file has been deleted..`)
            logger.info(`${filePath} file has been deleted..`)
        }
    });
}