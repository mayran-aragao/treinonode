const User = require('../models/User');
const crypto = require ('crypto');
const mailHandler = require ('../handlers/mailHandler');

exports.login = (req,res) =>{
    res.render('login');
};

exports.loginAction = (req,res) => {
    const auth = User.authenticate();

    auth(req.body.email, req.body.password, (error, result) =>{
        if(!result){
            req.flash('error','Error: '+error.message);
            res.redirect('/users/login');
            return;
        }

        req.login(result, ()=>{});

        req.flash('sucess', 'Você foi logado com sucesso!');
        res.redirect('/'); 
    });
};

exports.logout = (req, res) => {
    req.logout();
    res.redirect('/')
};

exports.register = (req,res) =>{
    res.render('register');
};
exports.registerAction = (req,res) => {
    const newUser = new User(req.body);
    User.register(newUser, req.body.password, (error)=>{
        if(error){
            req.flash('error','Error: '+error.message);
            res.redirect('/users/register');
            return;
    }
    req.flash('sucess', 'Registro efetuado com sucesso, faça o login');
    res.redirect('/users/login'); 
    });
};
exports.profile = (req,res) => {
    res.render('profile');
};

exports.profileAction = async (req,res) => {
    try{
    const user = await User.findOneAndUpdate(
        {_id:req.user._id},
        {name: req.body.name ,email:req.body.email},
        {new:true, runValidators:true}
    );
    }catch(e){
        req.flash('error','Ocorreu algum erro: '+e.message); 
        req.redirect('/profile');
        return;
    };
    req.flash('sucess','Dados atualizados com sucesso!');
    res.redirect('/profile');
};

exports.forget = (req, res) => {
    res.render('forget');
};
exports.forgetAction = async(req, res) => {
    const user = await User.findOne({email:req.body.email}).exec();
    if(!user){
        req.flash('error','Email não cadastrado.');
        res.redirect('/users/forget');
        return;
    }
    //gerar token
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;//1hr
    await user.save();
    //link com troca de senha
    const resetLink = `http:/${req.headers.host}/users/reset/${user.resetPasswordToken}`;

    const html = `Testando e-mail com link: <br/> <a href="${resetLink}">Resetar sua senha</a>`;
    const text = `testando email com link: ${resetLink}`;
    mailHandler.send({
        to:user.email,
        subject:'Resetar sua senha',
        html,
        text,
    });

    req.flash('sucess', 'Te enviamos um e-mail com instruçoes.');
    res.redirect('/users/login');
};
exports.forgetToken = async (req,res) => {
    const user = await User.findOne({
        resetPasswordToken:req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    }).exec();

    if(!user){
        req.flash('error', 'Token Expirado!');
        res.redirect('/users/forget');
        return;
    };
    res.render('forgetPassword');
};

exports.forgetTokenAction = async (req,res) => {
    const user = await User.findOne({
        resetPasswordToken:req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    }).exec();

    if(!user){
        req.flash('error', 'Token Expirado!');
        res.redirect('/users/forget');
        return;
    };
    if(req.body.password != req.body['password-confirm']){
        req.flash('error', 'Senhas não batem');
        res.redirect('back');
        return;
    }
    user.setPassword(req.body.password, async ()=>{
        await user.save();

        req.flash('sucess',"Senha alterada com sucesso!");
        res.redirect('/');
    });
};