const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fastify = require('fastify')({ logger: true })

let intnumber = process.env.aisfiber_internet_id || 'xxxxxxxxxx'
let lasttime = new Date();
let nowtime = lasttime;
let headers = {
    "accept": "*/*",
    "accept-language": "th-TH,th;q=0.9,en;q=0.8",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "sec-ch-ua": "\".Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"103\", \"Chromium\";v=\"103\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
    "Referer": "https://myaisfibre.com/?page=toggleSpeed",
    "Referrer-Policy": "strict-origin-when-cross-origin"
};

fastify.get('/', async (request, reply) => {
    //let rotateofspeed from query rotatespeed
    let rotatespeed = request.query.rotatespeed
    if (intnumber == 'xxxxxxxxxx' || intnumber == '' || intnumber.length != 10) {
        return { result: 'ignore', Msg: 'Please set internet id in environment variable aisfiber_internet_id' }
    }
    //if lasttime < nowtime 5 minute
    nowtime = new Date();
    if (lasttime.getTime() + 300000 > nowtime.getTime() && lasttime.getTime() != nowtime.getTime()) {
        return { result: 'ignore', Msg: 'please wait 5 minutes for next request' }
    } else {
        const getrequest = await fetch("https://myaisfibre.com/index.php", { "headers": headers, "body": "page=toggleSpeed&action=confirmChangeSpeed&data=rotate(" + rotatespeed + ")", "method": "POST" })
        const getresponse = await getrequest.json();
        if (getresponse.Result == 'OK' || getresponse.result == 'OK') {
            const confrimrequest = await fetch("https://myaisfibre.com/index.php", { "headers": headers, "body": "page=toggleSpeed&action=toggleBandwidth&data%5Bnon%5D=" + intnumber + "&data%5Bcode%5D=rotate(" + rotatespeed + ")", "method": "POST" })
            const confrimresponse = await confrimrequest.json();
            const result = confrimresponse.Result || confrimresponse.result;
            if (result.toUpperCase() == 'SUCCESS') {
                lasttime = new Date();
                return { result: 'success', Msg: 'change internet speed to' + confrimresponse.data }
            } else {
                return { result: 'error', Msg: confrimresponse.detail }
            }
        } else {
            return { result: 'error', Msg: getresponse.Msg }
        }
    }
})

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()