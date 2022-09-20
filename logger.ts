import winston from 'winston';
import dotenv from 'dotenv';
dotenv.config();
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.prettyPrint()
    ),
    defaultMeta: { service: process.env.PROJECT },
    transports: [
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        new winston.transports.File({ filename: 'logs/all.log' }),
        // TODO: uncomment to enable winston logging on the console
        //new winston.transports.Console(),
    ],
});

export default logger;