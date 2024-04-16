import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

const userSchema = new Schema(
    {
        username: {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true,
        },

        email: {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
        },

        fullName: {
            type : String,
            required : true,
            lowercase : true,
            trim : true,
        },

        avatar: {
            type : String, 
            required : true,
        },

        coverImage: {
            type : String
        },

        watchHistory: [
            {
                type : Schema.Types.ObjectId,
                ref : "Video",
            }
        ],

        password: {
            type : String,
            required : [true , "Passeord is required"],
        },

        refreshToken: {
            type : String
        }
    } , 
    {
        timestamps : true
    }
)
// if(this.isModified("password")){
    //     this.password = bcrypt.hash(this.password)
    //     next()
    // }
    // return next()
    
    // both of these can be done for encrypting the password


    userSchema.pre("save", async function (next) {
        try {
            if(!this.isModified("password")) return next();
        
            this.password = await bcrypt.hash(this.password, 10)
            return next()
        } catch (error) {
            return next(error)
        }
    })
    
    userSchema.methods.isPasswordCorrect = async function(password){
        try {
            return await bcrypt.compare(password, this.password)
        } catch (error) {
            console.error('Error comparing passwords:', error)
            // throw new ApiError(300 , "error happens while comparing")
        }
    }

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User' , userSchema)