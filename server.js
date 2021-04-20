'use strict';
// Prepare the server

require('dotenv').config();
const express = require('express');
// const { Console } = require('node:console');
const superagent = require('superagent');
const pg = require('pg');
const methodoverride = require('method-override');
const app = express();
const client = new pg.Client(process.env.DATABASE_URL)
app.set('view engine', 'ejs');
const PORT = process.env.PORT;
app.use(express.static('./public/'));
app.use(express.urlencoded({extended : true}))
app.use(methodoverride('_method'));
client.connect().then(()=>{

    app.listen(PORT , ()=> console.log(`I'm using ${PORT} port`))
})
app.get('/', indexHandler);
app.get('/details', detailsHandler);
// app.get('/all', allHandler);
app.get('/getCountryResult', getHandler);
app.get('/myRecords', dataHandler)
app.post('/getCountryResult', postHandler);
app.get('/view/:id', getIdHandler)
app.put('/view/:id', putIdHandler)
app.delete('/view/:id', deleteIdHandler)

function indexHandler(req, res){
    let url = 'https://api.covid19api.com/world/total';
    superagent.get(url).then(x => {
        console.log(x.body)
        res.render('index', {nar: x.body})
    })
}
function getHandler(req, res){
    console.log(req.query.country)
    let url = `https://api.covid19api.com/country/${req.query.country}/status/confirmed?from=2020-03-01T00:00:00Z&to=2020-04-01T00:00:00Z`;
    superagent.get(url).then( x => {
        res.render('sad', {result: x.body})
    })
}
function Country (data) {
    this.name = data.Country;
    this.conf = data.TotalConfirmed;
    this.death = data.TotalDeaths;
    this.rec  = data.TotalRecovered ;
    this.date = data.Date
}
function detailsHandler(req, res){
    let url = 'https://api.covid19api.com/summary';
    superagent.get(url).then( x => {
        
        let myData = x.body.Countries.map( y =>  new Country(y));
        res.render('pageTwo', {country: myData})
    } )
}

function postHandler(req, res){
const {name, conf,death,rec,date} = req.body;
let SQL = 'INSERT INTO country (name, conf,death,rec,date) VALUES ($1,$2,$3,$4,$5)';
let val = [name, conf,death,rec,date];
client.query(SQL,val).then( x => {
    res.redirect('/myRecords')
})
}

function dataHandler(req,res){
let SQL = 'SELECT * FROM country';
client.query(SQL).then(x => {
    // console.log(x.rows);
    res.render('data', {result: x.rows})
})
}
function getIdHandler(req, res) {
    let id = [req.params.id];
    let SQL = 'SELECT * FROM country WHERE id=$1';
    client.query(SQL,id).then( x => {
        console.log(x.rows);
        res.render('view', { data: x.rows[0]})
    })
}
function putIdHandler(req, res){
const {name, conf,death,rec,date,id} = req.body;
let SQL = 'UPDATE country SET name=$1, conf=$2,death=$3,rec=$4,date=$5 WHERE id=$6';
let val = [name, conf,death,rec,date,id];
client.query(SQL, val).then( x => {
    res.redirect(`/view/${id}`)
})
}
function deleteIdHandler(req, res){
    let id = req.body.id;
    let SQL = 'DELETE FROM country WHERE id=$1';
    client.query(SQL, [id]).then(x => {
        res.redirect('/myRecords')
    })
}