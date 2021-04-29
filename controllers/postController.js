const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const slug = require('slug');

exports.view = async(req,res) => {
    const post = await Post.findOne({slug:req.params.slug});
    res.render('view', {post})
};

exports.add = ( req,res) => {
    res.render('postAdd');
};

exports.addAction = async (req,res) => {
    req.body.tags = req.body.tags.split(',').map(t=>t.trim());
    req.body.author = req.user._id;
    const post = new Post(req.body);

    try{
        await post.save();
    } catch(error) {
        req.flash('error','Error: '+error.message);
        return res.redirect('/post/add');
    }
    
    req.flash('sucess','Post salvo com sucesso!');
    res.redirect('/');
};

exports.edit = async(req,res) => {
    const post = await Post.findOne({slug:req.params.slug});
    res.render('postEdit', {post})
};
exports.editAction = async (req,res) => {
        req.body.slug = slug(req.body.title,{lower:true});
        /*const slugRegex = new RegExp(`^(${req.body.slug})((-[0-9]{1,}$)?)$`, 'i');
        const postsWithSlug = await Post.find({slug:slugRegex});
            if(postsWithSlug.length > 0) {
                req.body.slug = `${req.body.slug}-${postsWithSlug.length + 1}`;
                return;
            }*/
   
    req.body.tags = req.body.tags.split(',').map(t=>t.trim());
    try{
        const post = await Post.findOneAndUpdate(
            {slug:req.params.slug},
            req.body,
            {
                new:true,//retornar novo item att
                runValidators:true
            });
        }catch(error){
            req.flash('error','Error: tente novamente');
            return res.redirect('/post/'+req.params.slug+'/edit');
        };
    
    req.flash('sucess', 'Post Atualizado com sucesso' );
    res.redirect('/');
};
exports.delete = async(req, res) => {
    let deletePost = req.params.slug;
  
    try { 
        await Post.findOneAndDelete({slug: deletePost});
    }catch(error) {
        req.flash('error', 'Erro ao excluir o post, tente novamente!');
        res.redirect('/post'+ req.params.slug + '/delete');
    }
    req.flash('success', 'Sucesso ao excluir o post');
    res.redirect('/');
    
};
