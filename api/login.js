import { file } from "../lib/file.js";
import { IsValid } from "../lib/IsValid.js";
import { utils } from "../lib/utils.js";

const handler = {};

handler.init = async (data, callback) => {
    const allowedMethods = ['get', 'post', 'put', 'delete'];
    if (allowedMethods.includes(data.httpMethod)) {
        return await handler._handler[data.httpMethod](data);
    }
    return ['ERROR: neleistinas http metodas', 400];
}

handler._handler = {}

handler._handler.get = (data) => {
    console.log('login:GET logika...');
    return 'GET response';
}

handler._handler.post = async (data) => {
    const { payload } = data;
    const { email, password } = payload;

    const [errEmail, msgEmail] = IsValid.email(email);
    if (errEmail) {
        return [msgEmail, 400];
    }

    const [errPassword, msgPassword] = IsValid.password(password);
    if (errPassword) {
        return [msgPassword, 400];
    }

    const salt = '5er8g4b526er5';
    const [hashErr, hashMsg] = utils.hash(password + salt);
    if (hashErr) {
        return ['Nepavyko prijungti paskyros', 500];
    }

    payload.password = hashMsg;

    const [readErr, readMsg] = await file.read('users', email + '.json');
    if (readErr) {
        return ['Negeras email arba password', 400];
    }

    const parseMsg = utils.parseJsonToObject(readMsg);
    if (Object.keys(parseMsg).length === 0) {
        return ['Serverio klaida bandant atpazinti vartotoja', 500];
    }

    if (parseMsg.password !== hashMsg) {
        return ['Negeras email arba password', 400];
    }

    const tokenID = utils.uuid(20);

    const [tokenErr] = await file.create('/tokens', tokenID + '.json', { email });
    if (tokenErr) {
        return ['Nepavyko prijungti vartotojo', 500];
    }

    const token = [
        `token=${tokenID}`,
        'Max-Age=3600',
        'Path=/',
        // 'Secure',
        'HttpOnly',
        'SameSite=Strict',
    ];

    return ['OK', 200, {
        'Set-Cookie': `${token.join('; ')}`,
    }];

    // const [err, msg] = await file.create('/users', email + '.json', payload);
    // return err ? 'Nepavyko sukurti paskyros' : msg;
}

handler._handler.put = (data) => {
    console.log('login:PUT logika...');
    return 'PUT response';
}

handler._handler.delete = (data) => {
    console.log('login:DELETE logika...');
    return 'DELETE response';
}

export default handler;