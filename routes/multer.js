const multer=require('multer');
const {v4:uuidv4}=require("uuid");
const path =require("path")

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/images/uploads')
    },
    filename:function(req,file,cb){
        const uniquefilename=uuidv4();
        cb(null,uniquefilename+path.extname(file.originalname))
    }
})

const upload=multer({storage:storage});

const storagedp=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/images/dpside')
    },
    filename:function(req,file,cb){
        const uniquefilename=uuidv4();
        cb(null,uniquefilename+path.extname(file.originalname))
    }
})
const dpupload=multer({storage:storagedp})



module.exports={
    
    upload,
    dpupload

};