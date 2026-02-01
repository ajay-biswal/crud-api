import {User} from "../models/User.model.js";

export const createUser= async(req,res)=>{
    try{
        const user = await User.create(req.body);
        return res.status(201).json(user);
    }catch(err){
        return res.status(500).json({message: err.message});
    }
}

export const getUsers = async(req,res)=>{
    try{
        const users= await User.find();
        return res.status(200).json(users);
    }catch(error){
        return res.status(500).json({message: error.message})
    }
}

export const getUser = async(req,res)=>{
    try{
        const {id} = req.params;
        const user = await User.findById(id);
        if(!user){
            return res.status(404).json({messgae: "user not found"})
        }
        return res.status(200).json(user);
    }catch(error){
        return res.status(500).json({message: error.message});
    }
}

export const updateUser = async(req,res)=>{
    try{
        const {id} = req.params;
        const user = await User.findByIdAndUpdate(id, req.body);
        if(!user){
            return res.status(400).json({message: "user not found"});
        }
        return res.status(200).json(user);
    }catch(error){
        return res.status(500).json({message: error.message});
    }
}

export const deleteUser = async(req,res)=>{
    try{
        const {id}= req.params;
        const user = await User.findByIdAndDelete(id);
        if(!user){
            return res.status(404).json({message: "user not found"});
        }
        res.status(200).json(user);
    }catch(error){
        return res.status(500).json({message: error.message});
    }
}