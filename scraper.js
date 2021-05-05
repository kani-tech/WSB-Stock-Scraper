


const puppeteer = require('puppeteer')
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OLD_REDDIT = 'https://old.reddit.com/r/wallstreetbets/'

const monthNames = ["january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
];



const stockSchema = new Schema({
    ticker: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    }
})

const stocks = mongoose.model('stock', stockSchema)

const nasdaq = require('./nasdaq.js')
app.use(cors())


mongoose.connect('mongodb://localhost:27017/stockscraper', { useNewUrlParser: true, useUnifiedTopology: true })

mongoose.connection.on('connected', () => {
    console.log('DB Connected')
})

const PORT = process.env.PORT || 5000

async function getId(url) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.goto(url)

    const info = await page.$$('#siteTable')

    let current = new Date()

    let time = current.getHours()

    console.log('time', time)
    //console.log('length', info.length)

    let id = ''
    for (let i = 0; i < info.length; i++) {
        const result = (await (await info[i].getProperty('innerHTML')).jsonValue())


        let PATTERN = ''
        if (time >= 16) {
            PATTERN = 'tomorrow'
        } else {
            PATTERN = 'discussion'
        }
        const splitResult = result.split(' ').filter(word => word.includes(PATTERN))

        const findUrl = splitResult[0].slice(37)

        for (let n = 0; n < findUrl.length; n++) {
            if (findUrl[n] !== '/') {
                id += findUrl[n]
            } else {
                break;
            }
        }

    }

    browser.close()

    return id
}




async function scrapeComments(url, key) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url)

    const comments = await page.$$(`#siteTable_t3_${key}`)


    let stockArr = []
    for (let i = 0; i < comments.length; i++) {

        const comment = String(await (await comments[i].getProperty('innerText')).jsonValue());

        //console.log('comment', comment)

        const splitComment = comment.split(' ').filter(word => word.length <= 4)


        for (let n = 0; n < splitComment.length; n++) {
            if (nasdaq.includes(splitComment[n])) {
                stockArr.push(splitComment[n])
            }
        }
    }

    browser.close();

    console.log('stockArr', stockArr)

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


app.get('/', async function (req, res) {

    getId(OLD_REDDIT).then(response => res.send(response));


})



app.post('/', async function (req, res) {

    let my_arr = []

    const key = await getId(OLD_REDDIT);

    let current = new Date();


    const month = monthNames[current.getMonth()]

    let day = current.getDate()

    let time = current.getHours();

    let url = ``


    if (day < 10) {
        day = '0' + String(day)
    }


    if (time >= 16) {
        url = `https://old.reddit.com/r/wallstreetbets/comments/${key}/daily_discussion_thread_for_${month}_${day}_2021/?limit=500`
    } else {
        url = `https://old.reddit.com/r/wallstreetbets/comments/${key}/what_are_your_moves_tomorrow_${month}_${day}_2021/`
    }

    console.log('day', day)



    await scrapeComments(url, key).then(function (response) {
        my_arr = Object.entries(countOccurences(response));
    })

    console.log('my_arr', my_arr)

    console.log('length', my_arr.length)
    for (let i = 0; i < my_arr.length; i++) {
        stocks.findOne({ ticker: my_arr[i][0] }, await function (err, foundStock) {
            if (err) {
                console.log(err)
            } else if (foundStock) {
                stocks.updateOne({ ticker: my_arr[i][0] }, { count: my_arr[i][1] })
            } else {
                const newStock = new stocks({
                    ticker: my_arr[i][0],
                    count: my_arr[i][1]
                })
                newStock.save();
            }
        })
    }

    stocks.find({}, await function (err, foundStocks) {

        console.log('foundStocks', foundStocks)
        res.send(foundStocks)
    })
})


app.listen(PORT, function (err) {
    if (err) {
        console.log(err)
    } else {
        console.log('Server running on port', PORT)
    }
})

