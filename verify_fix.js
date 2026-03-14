const axios = require('axios');

async function verify() {
    try {
        // 1. Login as Admin
        console.log("Logging in as admin...");
        const loginRes = await axios.post('http://localhost:5050/admin/main/login', {
            username: 'admin',
            password: 'admin123'
        });

        if (!loginRes.data.success) {
            console.error("Login failed:", loginRes.data);
            return;
        }

        const token = loginRes.data.token;
        console.log("Login successful. Token obtained.");

        // 2. Fetch Properties (using the new route logic)
        console.log("Fetching properties from /admin/properties...");
        // Note: In admin.js, the route path was 'properties', mounted on '/admin'. 
        // And there was another one at '/main/properties'. 
        // My frontend uses 'http://localhost:5050/admin/properties' (from the edit in step 375).
        // Let's verify THAT specific endpoint.

        const propRes = await axios.get('http://localhost:5050/admin/properties', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const properties = propRes.data;
        console.log(`Successfully fetched ${properties.length} properties.`);

        if (properties.length > 0) {
            console.log("Sample Property:", properties[0].name);
            console.log("Verification PASSED: Admin can see properties.");
        } else {
            console.log("Verification WARNING: List is empty. (Did you add properties to the db?)");
        }

    } catch (error) {
        console.error("Verification FAILED:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

verify();
