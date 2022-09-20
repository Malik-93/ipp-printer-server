import request from 'supertest';
import app from './app';
import fs from 'fs';
describe('Printer Local Server', function () {
    it('GET / - should send back a JSON object', async function () {
        try {
            await request(app)
                .get('/')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, function (err, res) {
                    if (err) throw err;
                    const { active, message } = res.body;
                    expect(active).toBe(true);
                    expect(message).toBe("Printer server is up");
                });
        } catch (error) {
            console.log(error);
        }

    });

    it('POST /print - should send a print request to a local printer', async function () {
        try {
            const filePath = `${__dirname}/assets/dummy.pdf`;
            const isFileExist = fs.existsSync(filePath);
            if (!isFileExist) throw new Error('file does not exist');
            await request(app)
                .post('/print')
                .attach("file", filePath)
                .expect(200, function (err, res) {
                    if (err) throw err;
                    const { success, message } = res.body;
                    expect(success).toBe(true);
                    expect(message).toBe("Request has been sent to printer...");
                });
        } catch (error) {
            console.log(error);
        }
    });

});
