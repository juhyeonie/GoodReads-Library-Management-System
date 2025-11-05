if (typeof requireAuth === 'function') requireAuth();

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab-btn");
    const panels = document.querySelectorAll(".tab-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const target = tab.getAttribute("data-tab");
            panels.forEach(panel => {
                panel.classList.toggle("hidden", panel.id !== target);
            });
        });
    });
});
if (typeof requireAuth === 'function') requireAuth();

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab-btn");
    const panels = document.querySelectorAll(".tab-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const target = tab.getAttribute("data-tab");
            panels.forEach(panel => {
                panel.classList.toggle("hidden", panel.id !== target);
            });
        });
    });

    // fetch current user email and populate
    async function loadCurrentUser() {
        try {
            const res = await fetch('Backend/api/fetch_current_user.php', { credentials: 'same-origin' });
            const json = await res.json();
            if (!res.ok || !json.success) {
                console.warn('Could not fetch user', json);
                return;
            }
            const user = json.user;
            const emailPanel = document.getElementById('email');
            if (emailPanel) {
                const inputs = emailPanel.querySelectorAll('input[type="email"]');
                if (inputs[0]) inputs[0].value = user.email || '';
            }
            // update membership display
            const membershipPanel = document.getElementById('membership');
            if (membershipPanel && user.plan) {
                const planNameEl = membershipPanel.querySelector('.plan-name');
                const planDescEl = membershipPanel.querySelector('.plan-desc');
                if (planNameEl) planNameEl.textContent = `${user.plan} - PHP ??.00`;
                if (planDescEl) planDescEl.textContent = user.plan ? `Active plan: ${user.plan}` : planDescEl.textContent;
            }
        } catch (err) {
            console.error('User fetch error', err);
        }
    }
    loadCurrentUser();

    // EMAIL TAB
    const emailPanel = document.getElementById('email');
    if (emailPanel) {
        const [currentEmailInput, newEmailInput] = emailPanel.querySelectorAll('input[type="email"]');
        const confirmEmailBtn = emailPanel.querySelector('.confirm-btn');
        const cancelEmailBtn = emailPanel.querySelector('.cancel-btn');

        if (confirmEmailBtn) {
            confirmEmailBtn.addEventListener('click', async () => {
                const current = (currentEmailInput.value || '').trim();
                const neu = (newEmailInput.value || '').trim();
                if (!current || !neu) return alert('Both fields required');
                const fd = new FormData();
                fd.append('current_email', current);
                fd.append('new_email', neu);
                try {
                    const res = await fetch('Backend/api/update_email.php', { method: 'POST', body: fd, credentials: 'same-origin' });
                    const json = await res.json();
                    if (!res.ok || !json.success) return alert(json.message || 'Failed to update email');
                    alert('Email updated');
                    currentEmailInput.value = neu;
                    newEmailInput.value = '';
                } catch (err) {
                    console.error(err);
                    alert('Network error');
                }
            });
        }
        if (cancelEmailBtn) cancelEmailBtn.addEventListener('click', () => {
            currentEmailInput.value = '';
            newEmailInput.value = '';
        });
    }

    // PASSWORD TAB
    const passwordPanel = document.getElementById('password');
    if (passwordPanel) {
        const [currentPw, newPw, rePw] = passwordPanel.querySelectorAll('input[type="password"]');
        const confirmPwBtn = passwordPanel.querySelector('.confirm-btn');
        const cancelPwBtn = passwordPanel.querySelector('.cancel-btn');

        if (confirmPwBtn) {
            confirmPwBtn.addEventListener('click', async () => {
                if (!currentPw.value || !newPw.value || !rePw.value) return alert('Please fill all fields');
                if (newPw.value !== rePw.value) return alert('New passwords do not match');
                const fd = new FormData();
                fd.append('current_password', currentPw.value);
                fd.append('new_password', newPw.value);
                fd.append('retype_password', rePw.value);

                try {
                    const res = await fetch('Backend/api/change_password.php', { method: 'POST', body: fd, credentials: 'same-origin' });
                    const json = await res.json();
                    if (!res.ok || !json.success) return alert(json.message || 'Failed to change password');
                    alert('Password updated.');
                    currentPw.value = newPw.value = rePw.value = '';
                } catch (err) {
                    console.error(err); alert('Network error');
                }
            });
        }
        if (cancelPwBtn) cancelPwBtn.addEventListener('click', () => {
            currentPw.value = newPw.value = rePw.value = '';
        });
    }

    // MEMBERSHIP TAB
    const membershipPanel = document.getElementById('membership');
    if (membershipPanel) {
        const cancelBtn = membershipPanel.querySelector('.cancel-membership');
        const changePlanBtn = membershipPanel.querySelector('.change-plan');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to cancel your membership?')) return;
                try {
                    const res = await fetch('Backend/api/cancel_membership.php', { method: 'POST', credentials: 'same-origin' });
                    const json = await res.json();
                    if (!res.ok || !json.success) return alert(json.message || 'Failed to cancel membership');
                    alert('Membership cancelled.');
                    // reflect UI changes
                    const planNameEl = membershipPanel.querySelector('.plan-name');
                    const planDescEl = membershipPanel.querySelector('.plan-desc');
                    if (planNameEl) planNameEl.textContent = 'Basic plan - PHP 100.00';
                    if (planDescEl) planDescEl.textContent = 'Access our collection of Educational Books.';
                } catch (err) { console.error(err); alert('Network error'); }
            });
        }

        if (changePlanBtn) {
            changePlanBtn.addEventListener('click', () => {
                window.location.href = 'Changeplan.html';
            });
        }
    }
});
