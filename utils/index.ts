import fs from 'fs';
import logger from '../logger';
import { networkInterfaces } from 'os';

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

export const get_network_ipv4 = (): string => {
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
    // console.log('networkIP', networkIP);
    return `${networkIP}`
}