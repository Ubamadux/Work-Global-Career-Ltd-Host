/* =========================================================
   WORK GLOBAL CAREER LTD
   REMOTE WORK TRAINING LANDING PAGE - JS
   File: js/landing-remote-work.js
   Uses separate Formspree: https://formspree.io/f/mnpqbwel
   NO resume field - this form has Remote / Remote Plus
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // Current year
    const yearEl = document.getElementById("current-year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // FAQ accordion
    const faqButtons = document.querySelectorAll(".faq-q");
    faqButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const item = btn.parentElement;
            const answer = item.querySelector(".faq-a");
            const wasOpen = item.classList.contains("open");
            document.querySelectorAll(".faq-item").forEach(function (i) {
                i.classList.remove("open");
                const a = i.querySelector(".faq-a");
                if (a) a.style.display = "none";
            });
            if (!wasOpen) {
                item.classList.add("open");
                if (answer) answer.style.display = "block";
            }
        });
    });

    // Formspree - separate endpoint mnpqbwel - NO RESUME
    const form = document.getElementById("training-enquiry-form");
    const successEl = document.getElementById("form-success");
    const errorEl = document.getElementById("form-error");
    const submitBtn = document.getElementById("form-submit-btn");

    if (form && successEl && errorEl && submitBtn) {

        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            successEl.style.display = "none";
            errorEl.style.display = "none";
            errorEl.textContent = "";

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const honeypot = form.querySelector('input[name="_gotcha"]');
            if (honeypot && honeypot.value) {
                return;
            }

            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Submitting...";

            try {
                const formData = new FormData(form);
                if (formData.get('_gotcha') === '') {
                    formData.delete('_gotcha');
                }
                // Ensure no resume field is sent
                formData.delete('resume');
                formData.delete('career-resume');
                formData.delete('career_resume');

                const response = await fetch(form.action, {
                    method: "POST",
                    body: formData,
                    headers: { "Accept": "application/json" }
                });

                const data = await response.json().catch(function(){ return {}; });

                if (response.ok) {
                    successEl.textContent = "Thank you! Your " + (formData.get('training_package') || 'Remote') + " training enquiry has been submitted. We will contact you via your preferred method shortly.";
                    successEl.className = "form-message success";
                    successEl.style.display = "block";
                    form.reset();
                    successEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    
                    // Auto-hide confirmation after 6 seconds
                    setTimeout(function() {
                        successEl.style.display = "none";
                        successEl.textContent = "";
                    }, 6000);
                } else {
                    let msg = "Submission failed. Please try again.";
                    if (data.errors && data.errors.length) {
                        msg = data.errors.map(function(err){ 
                            // If Formspree still says resume missing, show clear instruction
                            if (err.field === 'resume' || (err.message && err.message.toLowerCase().includes('resume'))) {
                                return "This Formspree form is still set to require a resume file. Please go to Formspree dashboard for form mnpqbwel > Settings > Disable File Uploads / remove resume field requirement, or create a new form for landing page.";
                            }
                            return (err.field ? err.field + ' ' : '') + err.message; 
                        }).join(", ");
                    } else if (data.error) {
                        msg = data.error;
                        if (msg.toLowerCase().includes('resume')) {
                            msg = "Formspree form mnpqbwel is configured to require a resume. Please disable file upload in Formspree dashboard for this form (Settings > Files > OFF) or create a new form ID for landing page without resume.";
                        }
                    }
                    throw new Error(msg);
                }
            } catch (err) {
                errorEl.textContent = "Could not submit enquiry: " + (err.message || "Please try again or WhatsApp +234 704 773 0737.");
                errorEl.className = "form-message error";
                errorEl.style.display = "block";
                setTimeout(function() {
                    errorEl.style.display = "none";
                    errorEl.textContent = "";
                }, 8000);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.documentElement.style.scrollBehavior = "auto";
    }
});