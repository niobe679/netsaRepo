const authService = require("../services/authservice");

const registerUser = async (req, res) => {
    try {
        const { username, full_name, email, password, phone_number, role } = req.body;

        // Call the service to handle business logic
        const { user, accessToken, refreshToken } = await authService.registerUser({
            username,
            full_name,
            email,
            password,
            phone_number,
            role,
            req
        });

        // Formatting response to match mobile app's expectation (handleAuthResponse)
        res.status(201).json({
            success: true,
            message: "User registered and logged in successfully",
            user,
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const verifyAccount = async (req, res) => {
    try {
        const { token } = req.params;
        await authService.verifyAccount(token);

        res.status(200).json({ message: "Account verified successfully! You can now log in." });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[Auth] loginUser controller hit for: ${email}`);
        // Call the service to handle login logic
        const { user, accessToken, refreshToken } = await authService.loginUser({ email, password, req });
        //console.log("check 2");
        // Send token in HTTP-only cookie
        // res.cookie("rftoken", refreshToken,"token", accessToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production", // Secure only in production
        //     sameSite: "Strict",
        // });
        console.log("login: ", refreshToken);
        res.status(200).json({ message: "Login successful", user, accessToken, refreshToken });
    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message });
    }
};

const test = async (req, res) => {
    try {
        //console.log("PP " +req.user.id)
        //const session = await authService.test({user_id: req.user.id, token: req.user.token })

        res.status(200).json({ message: "Success", data: req.user.token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
};

const refresh_token = async (req, res) => {
    try {
        //console.log(req.body, req.body.refresh_token);
        const { user, accessToken, refreshToken } = await authService.refresh_token({ refreshToken: req.body.refresh_token })
        console.log("ref: ", refreshToken);
        res.status(200).json({ message: "Success", data: { user, accessToken, refreshToken } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
};

const logoutUser = async (req, res) => {
    try {
        await authService.logoutUser(req.user.id);
        res.clearCookie("token");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const googleMobileLogin = async (req, res) => {
    try {
        const { token } = req.body;
        const { user, accessToken, refreshToken } = await authService.googleMobileLogin({ idToken: token, req });
        res.status(200).json({ message: "Login successful", user, accessToken, refreshToken });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
};

const googleWebLogin = async (req, res) => {
    try {
        const { accessToken } = req.body;
        // Use result object to avoid variable name conflict with input accessToken
        const result = await authService.googleMobileLogin({ accessToken, req });

        res.status(200).json({
            message: "Login successful",
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = { googleMobileLogin, googleWebLogin, registerUser, loginUser, verifyAccount, logoutUser, test, refresh_token };