const authService = require("../services/authservice");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("check 1 ");
        // Call the service to handle login logic
        const { user, accessToken, refreshToken } = await authService.loginAdmin({ email, password, req });
        console.log("check 2");
        // Send token in HTTP-only cookie
        res.cookie("rftoken", refreshToken,"token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Secure only in production
            sameSite: "Strict",
        });

        res.status(200).json({ message: "Admin Login successful", user, accessToken, refreshToken });
    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message });
    }
};

const test = async (req, res)=>{
    try {
        console.log("PP " +req.user.id)
        //const session = await authService.test({user_id: req.user.id, token: req.user.token })
 
        res.status(200).json({ message: "Success", data: req.user.token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
};

const refresh_token = async (req, res)=>{
    try {
        console.log(req.body, req.body.refresh_token);
        const {user, accessToken, refreshToken} = await authService.refresh_token({refreshToken: req.body.refresh_token})
        
        res.status(200).json({ message: "Success", data: {user, accessToken, refreshToken} });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
};
module.exports = {login, test, refresh_token};