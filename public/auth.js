// Check if already logged in
if (localStorage.getItem('currentUser')) {
    window.location.href = 'index.html';
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('errorMsg').textContent = '';
}

function showLogin() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('errorMsg').textContent = '';
}

async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Failed to create account');
            return;
        }

        showError('Account created! Please login.', 'success');
        setTimeout(showLogin, 1500);
    } catch (err) {
        showError('Network error. Please try again later.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Invalid username or password');
            return;
        }

        // Store user info
        localStorage.setItem('currentUser', data.username);
        localStorage.setItem('currentUserId', data.userId);
        window.location.href = 'index.html';
    } catch (err) {
        showError('Network error. Please try again later.');
    }
}

function showError(msg, type = 'error') {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = msg;
    errorMsg.className = type === 'success' ? 'success-msg' : 'error-msg';
}
