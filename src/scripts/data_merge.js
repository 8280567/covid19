const fs = require('fs')

const world_file = 'public/data/world.json'
const china_file = 'public/data/china.json'
const korea_file = 'public/data/korea.json'
const italy_file = 'public/data/italy.json'
const us_file = 'public/data/us.json'
const merged_file = 'public/data/all.json'

const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let data = JSON.parse(fs.readFileSync(world_file))

// remove Chinese data in provincal level
data[en2zh['China']][en2zh['Mainland China']] = {
    ENGLISH: 'Mainland China',
    confirmedCount: data[en2zh['China']][en2zh['Mainland China']].confirmedCount,
    curedCount: data[en2zh['China']][en2zh['Mainland China']].curedCount,
    deadCount: data[en2zh['China']][en2zh['Mainland China']].deadCount
}

// combine detailed province/state level data from countries
let chinaData = JSON.parse(fs.readFileSync(china_file))

data[en2zh['China']][en2zh['Mainland China']] = {
    ...data[en2zh['China']][en2zh['Mainland China']],
    ...chinaData
}
let koreaData = JSON.parse(fs.readFileSync(korea_file))
data[en2zh['South Korea']] = {
    ...koreaData,
    ...data[en2zh['South Korea']]
}
let italyData = JSON.parse(fs.readFileSync(italy_file))
data[en2zh['Italy']] = {
    ...italyData,
    ...data[en2zh['Italy']]
}

let usData = JSON.parse(fs.readFileSync(us_file))
data[en2zh['United States of America']] = usData

fs.writeFileSync(merged_file, JSON.stringify(data))
