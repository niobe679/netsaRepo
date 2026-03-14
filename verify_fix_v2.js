async function verify() {
    try {
        // 1. Login as Admin
        console.log("Logging in as admin...");
        const loginRes = await fetch('http://localhost:5050/admin/main/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error("Login failed:", loginData);
            return;
        }

        const token = loginData.token;
        console.log("Login successful. Token obtained.");

        // 2. Fetch Properties
        console.log("Fetching properties from /admin/properties...");
        const propRes = await fetch('http://localhost:5050/admin/properties', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!propRes.ok) {
            console.error(`Fetch failed with status: ${propRes.status}`);
            const errText = await propRes.text();
            console.error("Error body:", errText);
            return;
        }

        const properties = await propRes.json();
        console.log(`Successfully fetched ${properties.length} properties.`);

        if (properties.length > 0) {
            console.log("Sample Property:", properties[0].name);
            console.log("Verification PASSED: Admin can see properties.");
        } else {
            console.log("Verification WARNING: List is empty. (Did you add properties to the db?)");
        }

    } catch (error) {
        console.error("Verification FAILED:", error.message);
    }
}

verify();
