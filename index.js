const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fastify = require('fastify')({ logger: true })
const cheerio = require('cheerio');

let intnumber = process.env.aisfiber_internet_id || 'xxxxxxxxxx'
let speed = "500/500";
let lastrotate = '0deg';
let lastremainingCount = 0;
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

//nowtime - 5 minutes
nowtime = new Date(lasttime.getTime() - (5 * 60 * 1000));

fastify.get('/', async (request, reply) => {
    //let rotateofspeed from query rotatespeed
    let rotatespeed = request.query.rotatespeed
    let confirmchange = request.query.confirmchange ? request.query.confirmchange : 'false'
    if (intnumber == 'xxxxxxxxxx' || intnumber == '' || intnumber.length != 10) {
        return { result: 'ignore', message: 'Please set internet id in environment variable : aisfiber_internet_id' }
    }
    nowtime = new Date();
    if (lasttime.getTime() + 300000 > nowtime.getTime() && lasttime.getTime() != nowtime.getTime()) {
        if(lastrotate == rotatespeed){
            return { result: 'ignore', message: 'same speed don\'t need to change' }
        } else {
            return { result: 'ignore', message: 'please wait 5 minutes for next request' }
        }
    } else {
        const myspeed = await fetch('https://myaisfibre.com/')
        const $ = cheerio.load(await myspeed.text());
        //get all span
        let spans = $('span');
        //loop all span
        for (let i = 0; i < spans.length; i++) {
            //get span text
            let spantext = spans[i];
            try {
                //get only Text has Mbps and length is not over 15
                if (spantext.children[0].data.includes('Mbps') && spantext.children[0].data.length < 15) {
                    //remove Mbps and space and set to speed
                    speed = spantext.children[0].data.replace('Mbps', '').replace(' ', '');
                }
            } catch (error) {
                
            }
        }
        const toggleSpeed = await fetch('https://myaisfibre.com/?page=toggleSpeed&lang=th');
        const $toggleSpeed = cheerio.load(await toggleSpeed.text());
        //get text from span id remainingTimeHour and remainingTimeMinute
        let remainingTimeHour = $toggleSpeed('span#remainingTimeHour').text();
        let remainingTimeMinute = $toggleSpeed('span#remainingTimeMinute').text();
        let remainingCount = $toggleSpeed('span#remainingCount').text().trim();
        //get all div class wallGarden-Header-Text
        let wallGardenHeaderText = $toggleSpeed('div.wallGarden-Header-Text');
        let menu_text = $toggleSpeed('div.menu-text');
        let isenable = false;
        for (let i = 0; i < menu_text.length; i++) {
            if(menu_text[i].children[0].data.includes('ปรับ')){
                isenable = true;
            }
        }
        if(!isenable){
            reply.code(404)
            return { result: 'ignore', message: 'your package can\'t change speed' }
        }
        //console all div class wallGarden-Header-Text text
        let isUse = false;
        for (let i = 0; i < wallGardenHeaderText.length; i++) {
            if (wallGardenHeaderText[i].children[0].data.includes('ขณะนี้ท่านกำลังใช้งานปรับความเร็วเน็ต')) {
                isUse = true;
            }
            if (wallGardenHeaderText[i].children[0].data.includes('ระยะเวลาใช้งานคงเหลือ')) {
                let hour = 0;
                let minute = 0;
                //get hour between ระยะเวลาใช้งานคงเหลือ and ชั่วโมง
                try {
                    hour = parseInt(remainingTimeHour)
                } catch (error) {
                    hour = 0;
                }
                //get minute between ระยะเวลาใช้งานคงเหลือ and นาที
                try {
                    minute = parseInt(remainingTimeMinute)
                } catch (error) {
                    minute = 0;
                }
                //if hour > 0 or minute > 0
                if ((hour > 0 || minute > 0) && confirmchange == 'false') {
                    if (isUse) {
                        //return ignore and error 500
                        reply.code(404)
                        return { result: 'ignore', message: 'time remaining ' + hour + ' hour ' + minute + ' minute' }
                        // return { result: 'ignore', message: 'ระยะเวลาใช้งานคงเหลือ ' + hour + ' ชั่วโมง ' + minute + ' นาที' }
                    }
                }
            }
        }
        if (parseInt(remainingCount) < 1 || remainingCount.includes('-') || remainingCount == '' || remainingCount == undefined) {
            try {
                if (remainingCount != undefined || remainingCount != '') {
                    lastremainingCount = remainingCount;
                    reply.code(404)
                    return { result: 'ignore', message: 'can\'t change speed because having problem with api' }
                }
            } catch (error) {
            }
            reply.code(404)
            return { result: 'ignore', message: 'can\'t change speed because have no remaining change speed' }
        }
        const getrequest = await fetch("https://myaisfibre.com/index.php", { "headers": headers, "body": "page=toggleSpeed&action=confirmChangeSpeed&data=rotate(" + rotatespeed + ")", "method": "POST" })
        const getresponse = await getrequest.json();
        console.log(speed);
        console.log(getresponse.Msg);
        if ((getresponse.Result == 'OK' || getresponse.result == 'OK') && getresponse.Msg != speed) {
            const confrimrequest = await fetch("https://myaisfibre.com/index.php", { "headers": headers, "body": "page=toggleSpeed&action=toggleBandwidth&data%5Bnon%5D=" + intnumber + "&data%5Bcode%5D=rotate(" + rotatespeed + ")", "method": "POST" })
            const confrimresponse = await confrimrequest.json();
            const result = confrimresponse.Result || confrimresponse.result;
            if (result.toUpperCase() == 'SUCCESS') {
                lasttime = new Date();
                lastrotate = rotatespeed;
                return { result: 'success', message: 'change internet speed to ' + confrimresponse.data }
            } else {
                return { result: 'error', message: confrimresponse.detail }
            }
        } else {
            if(getresponse.Msg == speed){
                return { result: 'ignore', message: 'same speed don\'t need to change' }
            }else{
                return { result: 'error', message: getresponse.Msg }
            }
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