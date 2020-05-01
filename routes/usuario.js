const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require("../models/Usuario")
const Usuario = mongoose.model("usuarios")
const bcrypt = require("bcryptjs")
const passport = require("passport")

router.get("/registro", (req, res) => {
    res.render("usuarios/registro")
})

router.post("/registro", (req, res) => {
    var erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ textp: "Nome inválido" })
    }

    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({ textp: "email inválido" })
    }

    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({ textp: "senha inválido" })
    }

    if (req.body.senha.length < 4) {
        erros.push({ texto: "Senha muito curta" })
    }

    if (req.body.senha != req.body.senha2) {
        erros.push({ texto: "As senhas são diferentes, tente novamente!" })
    }

    if (erros.length > 0) {
        res.render("usuarios/registro", { erros: erros });
    } else {
        Usuario.findOne({ email: req.body.email }).then((usuario) => {
            if (usuario) {
                req.flash("error_msg", "Esse email ja possui um cadastro no sistema!");
                res.redirect("/usuarios/registro");
            } else {
                var novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(novoUsuario.senha, salt, (err, hash) => {
                        if (err) {
                            req.flash("error_msg", "Houve um erro durante o salvamento do usuário");
                            res.redirect("/");
                        } else {
                            novoUsuario.senha = hash;
                            novoUsuario.save().then(() => {
                                req.flash("success_msg", "Usuário cadastrado com sucesso!");
                                res.redirect("/");
                            }).catch(() => {
                                req.flash("error_msg", "Houve um erro na criação do usuário");
                                res.redirect("/usuarios/registro");
                            });
                        }
                    });
                });
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno");
            res.redirect("/");
        });
    }

})

router.get("/login", (req, res) => {
    res.render("usuarios/login")
})

router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/usuarios/login",
        failureFlash: true
    })(req, res, next)
})

router.get("/logout", (req, res) => {
    req.logOut()
    res.flash("success_msg", "Deslogado com sucesso!")
    res.redirect("/")
})


module.exports = router