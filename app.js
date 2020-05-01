const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const app = express();
const admin = require('./routes/admin')
const path = require('path') //com este moudelo voce manipula pasta, diretorios
const session = require('express-session');
const flash = require('connect-flash'); // Com flash ele criar a session uma unica vez e depois some quando regarrega
require("./models/Postagem")
const Postagem = mongoose.model('postagens')
require("./models/Categoria")
const Categoria = mongoose.model('categorias')
const usuarios = require('./routes/usuario') 
const passport = require("passport")
require("./config/auth")(passport)



//Configuracoes
    //Sessao
    app.use(session({
        secret: "cursodenode",
        resave: true,
        saveUninitialized: true
    }))

    app.use(passport.initialize())
    app.use(passport.session())
    app.use(flash())

    //MIDDLEWARES
    app.use((req,res,next) =>{
        //VARIAVEIS GLOBAIS
        res.locals.success_msg = req.flash("success_msg")
        res.locals.error_msg = req.flash("error_msg")
        res.locals.error = req.flash("error")
        res.locals.user = req.user || null;
        next()
    })

    //body-parser
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())

    //handlerbars
    app.engine('handlebars', handlebars({defaultLayout: 'main'}))
    app.set('view engine', 'handlebars')

    //Mongoose
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://localhost/blogapp', {useNewUrlParser: true, useUnifiedTopology: true}).then(() =>{
        console.log("Conectado com o Mongo");        
    }).catch((err) => {
        console.log("Erro ao se Conectar");
    });

    //Public
    app.use(express.static(path.join(__dirname, "public")))

//Rotas
    app.get('/', (req, resp) => {
        Postagem.find().lean().populate("categoria").sort({data: "desc"}).then((postagens) => {
            resp.render("index", {postagens: postagens})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/404")
        })
    })

    app.get("/404", (req, res) => {
        res.send('Error 404!')
    })

    app.get("/postagem/:slug", (req, res) => {
        Postagem.findOne({slug: req.params.slug}).lean().then((postagem) => {
            if(postagem){
                res.render("postagem/index", {postagem: postagem})
            }else{
                req.flash("error_msg", "Esta postagem não existe")
                res.redirect("/")
            }
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/")            
        })
    })

    app.get("/categorias", (req,res) =>{
        Categoria.find().lean().then((categorias) => {
            res.render("categorias/index", {categorias:categorias})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno ao listar categorias")
            res.redirect("/")            
        })
    })

    app.get("/categorias/:slug", (req,res) =>{
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
            if(categoria){
                
                Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                    res.render("categorias/postagens", {postagens: postagens, categoria:categoria})
                }).catch((error) => {
                    req.flash("error_msg", "Houve um erro ao listar os Posts")
                    res.redirect("/")
                })

            }else{
                req.flash("error_msg", "Esta categoria não existe")
                res.redirect("/")
            }
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/")            
        })
    })

    app.use('/admin', admin);
    app.use('/usuarios', usuarios);


//outros
const PORT = 8081;
app.listen(PORT, () => {
    console.log("Servidor Rodando na porta " + PORT);
})