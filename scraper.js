


const puppeteer = require('puppeteer')
const express = require('express');
const cors = require('cors');
const app = express();

const nasdaq = require('./nasdaq.js')
app.use(cors())

const PORT = process.env.PORT || 5000

async function scrapeComments(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url)

    let [numComments] = await page.$x('//*[@id="more_t1_gwryyv6"]/span')
    const txt = await numComments.getProperty('textContent');
    const rawTxt = await txt.jsonValue()


    var numb = rawTxt.match(/\d/g);
    numb = Number(numb.join(""));



    const comments = await page.$$('#siteTable_t3_n3sdrh')


    let stockArr = []
    for (let i = 0; i < comments.length; i++) {

        const comment = String(await (await comments[i].getProperty('innerText')).jsonValue());

        const splitComment = comment.split(' ').filter(word => word.length <= 5)


        for (let n = 0; n < splitComment.length; n++) {
            if (nasdaq.includes(splitComment[n])) {
                stockArr.push(splitComment[n])
            }
        }
    }

    browser.close();

    return stockArr

}

function countOccurences(arr) {
    var counts = {};

    console.log(arr.length)
    for (var i = 0; i < arr.length; i++) {
        var num = arr[i];
        counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    console.log('mycounts', counts)
    return counts
}


const myComments = scrapeComments('https://old.reddit.com/r/wallstreetbets/comments/n3sdrh/daily_discussion_thread_for_may_03_2021/').then(response => { countOccurences(response) })



app.get('/', async function (req, res) {
    let my_arr = []
    await scrapeComments('https://old.reddit.com/r/wallstreetbets/comments/n3sdrh/daily_discussion_thread_for_may_03_2021/?limit=500').then(response => { my_arr.push(countOccurences(response)) })

    res.send(my_arr)
})

app.listen(PORT, function (err) {
    if (err) {
        console.log(err)
    } else {
        console.log('Server running on port', PORT)
    }
})