const express = require('express');
const router = express.Router()
const mongoose = require('mongoose');
require('../models/Categoria')
const Categoria = mongoose.model("categorias");
require('../models/Postagem')
const Postagem = mongoose.model("postagens");
const {eAdmin} = require("../helpers/isAdmin")

router.get('/', eAdmin, (req, res) => {
    res.render('admin/index')
})

router.get('/posts', eAdmin, (req, res) => {
    res.send('Pagina de Posts')
})

router.get('/categorias', eAdmin, (req, res) => {
    Categoria.find().sort({date: 'desc'}).then((categorias) => {
        res.render('admin/categorias', {categorias: categorias.map(categorias => categorias.toJSON())})    
    }).catch((error) =>{
        req.flash("error_msg", "Houve um erro ao listar as categorias!")
        res.redirect("admin")
    })
})

router.get('/categorias/add', eAdmin, (req, res) => {
    res.render('admin/addcategorias')
})

router.post('/categorias/nova', eAdmin, (req, res) => {
    //Fazendo validações
    var erros = []
    
    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome Inválido"})
    }
    
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto: "slug Inválido"})
    }

    if(req.body.nome.length < 2){
        erros.push({texto: "Categoria muito pequena"})
    }

    if(erros.length > 0){
        res.render("admin/addcategorias", {erros: erros})
    }
    else{
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug
        }
    
        new Categoria(novaCategoria).save().then(() => {
            req.flash("success_msg", "Categorias criado com sucesso!")
            res.redirect("/admin/categorias")
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao salvar a categoria!")
            res.redirect("/admin")
        })
    }
})

router.get('/categorias/edit/:id', eAdmin, (req, res) => {
    Categoria.findOne({_id:req.params.id}).lean().then((categoria) => {
        res.render("admin/editcategorias", {categoria: categoria})
    }).catch((error) => {
        req.flash("error_msg", "Esta categoria não existe")
        res.redirect("/admin/categorias")
    })
})

router.post('/categorias/edit', eAdmin, (req, res) => {
    Categoria.findOne({_id: req.body.id}).then((categoria) => {
        
        categoria.nome = req.body.nome
        categoria.slug = req.body.slug

        categoria.save().then(() => {
            req.flash("success_msg", "Categorias editada com sucesso!")
            res.redirect("/admin/categorias")
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno ao editar a categoria!")
            res.redirect("/admin/categorias")
        })

    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao editar a categoria! " + err)
        res.redirect("/admin/categorias")
    })

}) 

router.post('/categorias/deletar', eAdmin, (req, res) => {
    Categoria.remove({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso!")
        res.redirect("/admin/categorias")
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro interno ao deletar a categoria!")
        res.redirect("/admin/categorias")
    })
})


//ROTAS PARA AS POSTAGENS

router.get("/postagens", eAdmin, function(req, res) {
    Postagem.find().lean().populate("categoria").sort({ data: "desc" }).then(function(postagens) {
        res.render("admin/postagens", { postagens: postagens });
    }).catch(function(err) {
        req.flash("error_msg", "Houve um erro ao listar as  postagens");
        res.redirect("/admin/postagens");
    });
});


router.get('/postagens/add', eAdmin, (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/addpostagens", {categorias: categorias})
    }).catch((err) =>{
        req.flash("error_msg", "Houve um erro ao carregar o formulario")
        res.redirect("/admin")
    })      
})


router.post('/postagens/nova', eAdmin, (req, res) => {
    var erros = []
    
    if(req.body.categoria == "0"){
        erros.push({texto: "Postagem invalida, registre uma nova categoria"})
    }

    if(erros.length > 0){
        res.render("admin/addpostagens", {erros: erros})
    }
    else{
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug
        }

        new Postagem(novaPostagem).save().then(() =>{
            req.flash("success_msg", "Postagem criado com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro durante o salvamento da postagem!")
            res.redirect("/admin")
        })
    }
})

router.get('/postagens/edit/:id', eAdmin, (req, res) => {
    Postagem.findOne({_id:req.params.id}).lean().then((postagem) => {        
        Categoria.find().lean().then((categorias) => {
            res.render("admin/editpostagens", {postagem: postagem, categorias: categorias})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao listar as categorias")
            res.redirect("/admin/postagens")
        })
    }).catch((error) => {
        req.flash("error_msg", "Houve um erro ao carregar formulario de edição")
        res.redirect("/admin/postagens")
    })
});

router.post('/postagem/edit', eAdmin, (req, res) => {
    Postagem.findOne({_id: req.body.id}).then((postagem) => {
        
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(() => {
            req.flash("success_msg", "Postagem editada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno ao editar a postagem!")
            res.redirect("/admin/postagens")
        })

    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao editar a postagem! " + err)
        res.redirect("/admin/postagens")
    })

}) 

router.get('/postagem/delete/:id', eAdmin, (req, res) => {
    Postagem.remove({_id: req.params.id}).then(() =>{
        req.flash("success_msg", "Postagem deletada com sucesso!")
        res.redirect("/admin/postagens")
    }).catch((err) =>{
        req.flash("error_msg", "Houve um erro ao deletar a postagem! " + err)
        res.redirect("/admin/postagens")
    })
})


module.exports = router;