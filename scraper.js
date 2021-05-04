


const puppeteer = require('puppeteer')
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


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

async function scrapeComments(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url)




    const comments = await page.$$('#siteTable_t3_n3sdrh')


    let stockArr = []
    for (let i = 0; i < comments.length; i++) {

        const comment = String(await (await comments[i].getProperty('innerText')).jsonValue());

        console.log('comment', comment)

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





app.post('/', async function (req, res) {

    let my_arr = []
    await scrapeComments('https://old.reddit.com/r/wallstreetbets/comments/n3sdrh/daily_discussion_thread_for_may_03_2021/?limit=500').then(function (response) {
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

