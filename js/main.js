/* =========================================================
   WORK GLOBAL CAREER LTD
   MAIN JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* ---------- MOBILE NAVIGATION ---------- */

    const menuToggle = document.querySelector(".menu-toggle");
    const mainNavigation = document.querySelector(".main-navigation");

    if (menuToggle && mainNavigation) {

        menuToggle.addEventListener("click", function () {

            mainNavigation.classList.toggle("active");

            const isOpen = mainNavigation.classList.contains("active");

            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation menu" : "Open navigation menu"
            );

        });

    }


    /* ---------- CLOSE MOBILE MENU AFTER LINK CLICK ---------- */

    const navigationLinks = document.querySelectorAll(
        ".main-navigation a"
    );

    navigationLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            if (window.innerWidth <= 700) {

                mainNavigation.classList.remove("active");

                if (menuToggle) {
                    menuToggle.setAttribute(
                        "aria-label",
                        "Open navigation menu"
                    );
                }

            }

        });

    });


    /* ---------- REVIEW FORM ---------- */

    const leaveReviewButton = document.getElementById("leave-review-btn");
    const reviewFormWrapper = document.getElementById("submit-review");

    if (leaveReviewButton && reviewFormWrapper) {

        /* OPEN REVIEW FORM */

        leaveReviewButton.addEventListener("click", function (event) {

            event.stopPropagation();

            reviewFormWrapper.style.display = "block";

            reviewFormWrapper.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        });


        /* KEEP FORM OPEN WHEN CLICKING INSIDE IT */

        reviewFormWrapper.addEventListener("click", function (event) {

            event.stopPropagation();

        });


        /* CLOSE WHEN CLICKING OUTSIDE */

        document.addEventListener("click", function (event) {

            if (
                reviewFormWrapper.style.display === "block" &&
                !reviewFormWrapper.contains(event.target) &&
                event.target !== leaveReviewButton
            ) {

                reviewFormWrapper.style.display = "none";

            }

        });


        /* CLOSE WITH ESC KEY */

        document.addEventListener("keydown", function (event) {

            if (
                event.key === "Escape" &&
                reviewFormWrapper.style.display === "block"
            ) {

                reviewFormWrapper.style.display = "none";

            }

        });

    }


    /* ---------- SUPABASE REVIEW FORM SUBMISSION ---------- */

    // Enter your Supabase project details here.
    const SUPABASE_URL = "https://qpqfyqgzvnaxpdpzldmz.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dYRUeB3IAupZgiAVzNbF-w_ZOJX0mTM";

    const supabaseClient = window.supabase && typeof window.supabase.createClient === "function"
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
        : null;

    const reviewForm = document.getElementById("review-form");
    const reviewFormMessage = document.getElementById("review-form-message");

    if (supabaseClient && reviewForm && reviewFormMessage && reviewFormWrapper) {

        reviewForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const submitButton = reviewForm.querySelector(
                'button[type="submit"]'
            );

            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";

            reviewFormMessage.style.display = "none";
            reviewFormMessage.textContent = "";

            try {

                const studentName = document
                    .getElementById("review-name")
                    .value.trim();

                const programme = document
                    .getElementById("review-programme")
                    .value;

                const rating = Number(
                    document.getElementById("review-rating").value
                );

                const reviewText = document
                    .getElementById("review-message")
                    .value.trim();

                const consentCheckbox = document.getElementById(
                    "review-consent"
                );

                if (!consentCheckbox || !consentCheckbox.checked) {
                    throw new Error(
                        "Please agree to the publication consent."
                    );
                }

                if (
                    !studentName ||
                    !programme ||
                    !rating ||
                    !reviewText
                ) {
                    throw new Error(
                        "Please complete all required fields."
                    );
                }

                const { error } = await supabaseClient
                    .from("student_reviews")
                    .insert({
                        student_name: studentName,
                        programme: programme,
                        rating: rating,
                        review_text: reviewText,
                        consent_to_publish: true,
                        status: "pending"
                    });

                if (error) {
                    throw error;
                }

                reviewForm.reset();

                reviewFormWrapper.style.display = "none";

                reviewFormMessage.textContent =
                    "Thank you for your review. Your feedback has been received and will be published.";

                reviewFormMessage.style.display = "block";

                reviewFormMessage.style.setProperty(
                    "color",
                    "#1a7f37",
                    "important"
                );

                setTimeout(function () {
                    reviewFormMessage.style.display = "none";
                    reviewFormMessage.textContent = "";
                }, 5000);

            } catch (error) {

                console.error(
                    "Review submission error:",
                    error
                );

                reviewFormMessage.textContent =
                    "Sorry, your review could not be submitted. Please try again.";

                reviewFormMessage.style.display = "block";

                reviewFormMessage.style.setProperty(
                    "color",
                    "#d71920",
                    "important"
                );

            } finally {

                submitButton.disabled = false;
                submitButton.textContent = "Submit Review";

            }

        });

    }


    /* ---------- LOAD APPROVED PUBLIC REVIEWS ---------- */

    const approvedReviewsList = document.getElementById(
        "approved-reviews-list"
    );

    let approvedReviews = [];
    let displayedReviewCount = 0;

    const REVIEWS_PER_LOAD = 3;

    const showMoreReviewsButton = document.createElement("button");
    showMoreReviewsButton.type = "button";
    showMoreReviewsButton.className = "btn btn-primary";
    showMoreReviewsButton.textContent = "Show More";
    showMoreReviewsButton.style.display = "none";
    showMoreReviewsButton.style.margin = "25px auto 0";

    async function loadApprovedReviews() {

        if (!approvedReviewsList) return;

        if (!supabaseClient) {

            approvedReviewsList.textContent =
                "Student reviews are temporarily unavailable. Please try again later.";

            return;
        }

        approvedReviewsList.replaceChildren();
        showMoreReviewsButton.style.display = "none";

        const loadingMessage = document.createElement("p");
        loadingMessage.textContent =
            "Loading approved student reviews...";

        approvedReviewsList.appendChild(loadingMessage);

        try {

            const { data, error } = await supabaseClient
                .from("student_reviews")
                .select(
                    "student_name, programme, rating, review_text, created_at, approved_at"
                )
                .eq("status", "approved")
                .eq("consent_to_publish", true)
                .order(
                    "approved_at",
                    {
                        ascending: false,
                        nullsFirst: false
                    }
                );

            if (error) {
                throw error;
            }

            approvedReviews = data || [];

            displayedReviewCount = Math.min(
                REVIEWS_PER_LOAD,
                approvedReviews.length
            );

            if (approvedReviews.length === 0) {

                const emptyMessage = document.createElement("p");

                emptyMessage.textContent =
                    "No approved student reviews are available yet. Be the first to share your experience.";

                approvedReviewsList.appendChild(emptyMessage);

                return;
            }

            displayMoreReviews();

        } catch (error) {

            console.error(
                "Public reviews loading error:",
                error
            );

            approvedReviewsList.replaceChildren();

            const errorMessage = document.createElement("p");

            errorMessage.textContent =
                "Student reviews are temporarily unavailable. Please try again later.";

            approvedReviewsList.appendChild(errorMessage);

        }

    }


    function displayMoreReviews() {

        /* Show the next 3 reviews when collapsed.
           Show all reviews when expanded. */

        const visibleReviews = approvedReviews.slice(
            0,
            displayedReviewCount
        );

        approvedReviewsList.replaceChildren();

        visibleReviews.forEach(function (review) {

            const article = document.createElement("article");
            article.className = "review-card";

            const stars = document.createElement("div");
            stars.className = "review-stars";

            stars.textContent =
                "★".repeat(review.rating) +
                "☆".repeat(5 - review.rating);

            const reviewText = document.createElement("p");

            reviewText.textContent =
                review.review_text;

            const author = document.createElement("div");
            author.className = "review-author";

            const studentName = document.createElement("strong");

            studentName.textContent =
                review.student_name;

            const programme = document.createElement("span");

            programme.textContent =
                review.programme;

            author.appendChild(studentName);
            author.appendChild(programme);

            article.appendChild(stars);
            article.appendChild(reviewText);
            article.appendChild(author);

            approvedReviewsList.appendChild(article);

        });


        /* Change the button depending on the current state. */

        if (displayedReviewCount >= approvedReviews.length) {

            showMoreReviewsButton.textContent =
                "Show Less";

            showMoreReviewsButton.style.display =
                approvedReviews.length > REVIEWS_PER_LOAD
                    ? "block"
                    : "none";

        } else {

            showMoreReviewsButton.textContent =
                "Show More";

            showMoreReviewsButton.style.display =
                "block";

        }

    }


    /* Add the button below the reviews grid. */

    if (approvedReviewsList) {

        approvedReviewsList.insertAdjacentElement(
            "afterend",
            showMoreReviewsButton
        );

    }


    /* Show more reviews or collapse back to the original 3. */

    showMoreReviewsButton.addEventListener(
        "click",
        function () {

            if (
                displayedReviewCount >=
                approvedReviews.length
            ) {

                /* Collapse back to the first 3 reviews. */

                displayedReviewCount = Math.min(
                    REVIEWS_PER_LOAD,
                    approvedReviews.length
                );

            } else {

                /* Reveal the next 3 reviews. */

                displayedReviewCount = Math.min(
                    displayedReviewCount + REVIEWS_PER_LOAD,
                    approvedReviews.length
                );

            }

            displayMoreReviews();

        }
    );


    /* Load approved reviews when the public page opens. */

    loadApprovedReviews();


    /* ---------- CONTACT FORM SUBMISSION ---------- */

    const contactForm =
        document.getElementById("contact-form");

    const contactFormMessage =
        document.getElementById("contact-form-message");

    if (contactForm && contactFormMessage) {

        contactForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                try {

                    const response = await fetch(
                        contactForm.action,
                        {
                            method: "POST",
                            body: new FormData(contactForm),
                            headers: {
                                "Accept": "application/json"
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            "Form submission failed."
                        );
                    }

                    /* CLEAR THE FORM */

                    contactForm.reset();

                    /* SHOW GREEN CONFIRMATION */

                    contactFormMessage.textContent =
                        "Thank you for contacting Work Global Career Ltd. Your enquiry has been received.";

                    contactFormMessage.style.display =
                        "block";

                    contactFormMessage.style.setProperty(
                        "color",
                        "#1a7f37",
                        "important"
                    );

                    /* HIDE MESSAGE AFTER 4 SECONDS */

                    setTimeout(function () {

                        contactFormMessage.style.display =
                            "none";

                        contactFormMessage.textContent =
                            "";

                    }, 4000);

                } catch (error) {

                    contactFormMessage.textContent =
                        "Sorry, your enquiry could not be sent. Please try again or contact us directly.";

                    contactFormMessage.style.display =
                        "block";

                    contactFormMessage.style.setProperty(
                        "color",
                        "#d71920",
                        "important"
                    );

                }

            }
        );

    }


    /* ---------- ADMISSIONS FORM SUBMISSION ---------- */

    const applicationForm =
        document.getElementById("application-form");

    const applicationFormMessage =
        document.getElementById("application-form-message");

    if (applicationForm && applicationFormMessage) {

        applicationForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                try {

                    const response = await fetch(
                        applicationForm.action,
                        {
                            method: "POST",
                            body: new FormData(applicationForm),
                            headers: {
                                "Accept": "application/json"
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            "Application submission failed."
                        );
                    }

                    applicationForm.reset();

                    applicationFormMessage.textContent =
                        "Thank you for your application. Your information has been received. Our team will contact you with the next steps.";

                    applicationFormMessage.style.display =
                        "block";

                    applicationFormMessage.style.setProperty(
                        "color",
                        "#1a7f37",
                        "important"
                    );

                    setTimeout(function () {

                        applicationFormMessage.style.display =
                            "none";

                        applicationFormMessage.textContent =
                            "";

                    }, 5000);

                } catch (error) {

                    applicationFormMessage.textContent =
                        "Sorry, your application could not be submitted. Please try again or contact us directly.";

                    applicationFormMessage.style.display =
                        "block";

                    applicationFormMessage.style.setProperty(
                        "color",
                        "#d71920",
                        "important"
                    );

                }

            }
        );

    }


    /* ---------- EMPLOYER SECTION CARDS AND FORMS ---------- */

    const employerCardForms = [
        {
            anchor: 'a[href="#hire-graduates"]',
            wrapperId: "hire-graduates"
        },
        {
            anchor: 'a[href="#host-graduate"]',
            wrapperId: "host-graduate"
        },
        {
            anchor: 'a[href="#career-employment"]',
            wrapperId: "career-employment"
        },
        {
            anchor: 'a[href="#discuss-project"]',
            wrapperId: "discuss-project"
        }
    ];

    const employerFormWrappers =
        employerCardForms
            .map(function (item) {
                return document.getElementById(
                    item.wrapperId
                );
            })
            .filter(Boolean);


    function closeEmployerForms() {

        employerFormWrappers.forEach(
            function (wrapper) {

                wrapper.classList.remove(
                    "active"
                );

            }
        );

    }


    employerCardForms.forEach(
        function (item) {

            const cardLink =
                document.querySelector(
                    item.anchor
                );

            const wrapper =
                document.getElementById(
                    item.wrapperId
                );

            if (!cardLink || !wrapper) {
                return;
            }


            cardLink.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    const wasActive =
                        wrapper.classList.contains(
                            "active"
                        );

                    closeEmployerForms();

                    if (!wasActive) {

                        wrapper.classList.add(
                            "active"
                        );

                        wrapper.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }

                }
            );


            wrapper.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                }
            );

        }
    );


    document.addEventListener(
        "click",
        closeEmployerForms
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {
                closeEmployerForms();
            }

        }
    );


    /* ---------- EMPLOYER & CAREER FORMS: FORMSPREE SUBMISSION ---------- */

    const employerFormConfigs = [

        {
            formId: "hire-graduates-form",
            messageId: "hire-graduates-form-message",
            success:
                "Thank you. Your hiring enquiry has been received. Our team will contact you soon."
        },

        {
            formId: "host-graduate-form",
            messageId: "host-graduate-form-message",
            success:
                "Thank you. Your graduate-hosting enquiry has been received. Our team will contact you soon."
        },

        {
            formId: "career-employment-form",
            messageId: "career-employment-form-message",
            success:
                "Thank you. Your career application has been received. Our team will review it and contact you if there is a suitable opportunity."
        },

        {
            formId: "discuss-project-form",
            messageId: "discuss-project-form-message",
            success:
                "Thank you. Your project enquiry has been received. Our team will contact you regarding your requirements."
        }

    ];


    function showEmployerFormMessage(
        message,
        text,
        isSuccess
    ) {

        message.textContent = text;

        message.style.display = "block";

        message.style.setProperty(
            "color",
            isSuccess
                ? "#1a7f37"
                : "#d71920",
            "important"
        );

    }


    function clearEmployerFormMessage(
        message
    ) {

        message.style.display = "none";
        message.textContent = "";

    }


    function restoreEmployerSubmitButton(
        submitButton,
        originalButtonText
    ) {

        if (!submitButton) return;

        submitButton.disabled = false;

        if (originalButtonText !== null) {

            submitButton.textContent =
                originalButtonText;

        }

    }


   /* ---------- CAREER FORM WITH RESUME UPLOAD ---------- */

  async function submitCareerFormWithoutFetch(form, messageEl, successText, submitBtn, originalText) {
    const fileInput = form.querySelector("#career-resume");
    const linkInput = form.querySelector("#career-resume-link");
    const finalUrlInput = form.querySelector("#resume-final-url");
    const file = fileInput?.files[0];

    if (!file && !linkInput.value.trim()) {
        throw new Error("Please upload your resume file OR paste a Google Drive link.");
    }

    if (file) {
        if (!file.name.match(/\.(pdf|doc|docx)$/i)) {
            throw new Error("Resume must be PDF, DOC or DOCX.");
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("Resume too large — max 5MB. Use Google Drive link instead.");
        }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading resume...";

    try {
        let resumeUrl = linkInput.value.trim();

        if (file) {
            const fileName = `career_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { error } = await supabaseClient.storage.from('career-resumes').upload(fileName, file);
            if (error) throw new Error("Resume upload failed: " + error.message);
            const { data: urlData } = supabaseClient.storage.from('career-resumes').getPublicUrl(fileName);
            resumeUrl = urlData.publicUrl;
        }

        finalUrlInput.value = resumeUrl;
        const formData = new FormData(form);
        formData.delete('resume_file');

        const response = await fetch(form.action, {
            method: "POST",
            body: formData,
            headers: { "Accept": "application/json" }
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.errors ? result.errors.map(e => e.message).join(", ") : "Form submission failed.");
        }

        form.reset();
        messageEl.textContent = successText;
        messageEl.style.display = "block";
        messageEl.style.color = "#1a7f37";
        setTimeout(() => messageEl.style.display = "none", 6000);

    } catch (err) {
        messageEl.textContent = err.message;
        messageEl.style.display = "block";
        messageEl.style.color = "#d71920";
        throw err;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

    

        /* ---------- ATTACH EMPLOYER FORM HANDLERS ---------- */

    employerFormConfigs.forEach(
        function (config) {

            const form =
                document.getElementById(
                    config.formId
                );

            const message =
                document.getElementById(
                    config.messageId
                );


            if (!form || !message) {
                return;
            }


            form.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    const submitButton =
                        form.querySelector(
                            'button[type="submit"], input[type="submit"]'
                        );


                    const originalButtonText =
                        submitButton &&
                        submitButton.tagName === "BUTTON"
                            ? submitButton.textContent
                            : null;


                    if (submitButton) {

                        submitButton.disabled =
                            true;

                        if (
                            originalButtonText !==
                            null
                        ) {

                            submitButton.textContent =
                                "Submitting...";

                        }

                    }


                    clearEmployerFormMessage(
                        message
                    );


                    /*
                     * Career & Employment has a resume
                     * upload, so do not use fetch().
                     */

                    if (
                        form.id ===
                        "career-employment-form"
                    ) {

                        try {

                            await submitCareerFormWithoutFetch(
                                form,
                                message,
                                config.success,
                                submitButton,
                                originalButtonText
                            );

                        } catch (error) {

                            console.error(
                                "Career form submission error:",
                                error
                            );


                            showEmployerFormMessage(
                                message,
                                error.message ||
                                    "Sorry, your submission could not be sent. Please try again.",
                                false
                            );


                            restoreEmployerSubmitButton(
                                submitButton,
                                originalButtonText
                            );

                        }

                        return;
                    }


                    /*
                     * Hire Graduates,
                     * Host Graduate,
                     * and Discuss Project
                     * use AJAX/Formspree fetch.
                     */

                    try {

                        const response =
                            await fetch(
                                form.action,
                                {
                                    method: "POST",
                                    body: new FormData(
                                        form
                                    ),
                                    headers: {
                                        Accept:
                                            "application/json"
                                    }
                                }
                            );


                        const result =
                            await response
                                .json()
                                .catch(
                                    function () {
                                        return {};
                                    }
                                );


                        if (!response.ok) {

                            let errorText =
                                "Sorry, your submission could not be sent. Please try again.";


                            if (
                                result &&
                                Array.isArray(
                                    result.errors
                                ) &&
                                result.errors.length
                            ) {

                                errorText =
                                    result.errors
                                        .map(
                                            function (
                                                item
                                            ) {

                                                return item.message;

                                            }
                                        )
                                        .join(" ");

                            }


                            throw new Error(
                                errorText
                            );

                        }


                        form.reset();


                        showEmployerFormMessage(
                            message,
                            config.success,
                            true
                        );


                        window.setTimeout(
                            function () {

                                clearEmployerFormMessage(
                                    message
                                );

                            },
                            6000
                        );


                    } catch (error) {

                        console.error(
                            "Formspree submission error (" +
                                config.formId +
                                "):",
                            error
                        );


                        showEmployerFormMessage(
                            message,
                            error.message ||
                                "Sorry, your submission could not be sent. Please try again.",
                            false
                        );


                    } finally {

                        restoreEmployerSubmitButton(
                            submitButton,
                            originalButtonText
                        );

                    }

                }
            );

        }
    );


    /* ---------- REMOTE JOB GUIDE ---------- */

    const remoteJobGuideButton =
        document.getElementById(
            "remote-job-guide-btn"
        );

    const remoteJobGuide =
        document.getElementById(
            "remote-job-guide"
        );

    const remoteJobGuideClose =
        document.getElementById(
            "remote-job-guide-close"
        );

    const remoteJobGuideCloseBottom =
        document.getElementById(
            "remote-job-guide-close-bottom"
        );


    if (
        remoteJobGuideButton &&
        remoteJobGuide
    ) {

        remoteJobGuideButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                remoteJobGuide.classList.add(
                    "active"
                );

            }
        );


        remoteJobGuide.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

            }
        );


        document.addEventListener(
            "click",
            function () {

                remoteJobGuide.classList.remove(
                    "active"
                );

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    remoteJobGuide.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (
        remoteJobGuideClose &&
        remoteJobGuide
    ) {

        remoteJobGuideClose.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                remoteJobGuide.classList.remove(
                    "active"
                );

            }
        );

    }


    if (
        remoteJobGuideCloseBottom &&
        remoteJobGuide
    ) {

        remoteJobGuideCloseBottom.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                remoteJobGuide.classList.remove(
                    "active"
                );

            }
        );

    }


    /* ---------- REMOTE WORK TIPS ---------- */

    const remoteWorkTipsButton =
        document.getElementById(
            "remote-work-tips-btn"
        );

    const remoteWorkTips =
        document.getElementById(
            "remote-work-tips"
        );

    const remoteWorkTipsClose =
        document.getElementById(
            "remote-work-tips-close"
        );

    const remoteWorkTipsCloseBottom =
        document.getElementById(
            "remote-work-tips-close-bottom"
        );


    if (
        remoteWorkTipsButton &&
        remoteWorkTips
    ) {

        remoteWorkTipsButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                remoteWorkTips.classList.add(
                    "active"
                );

            }
        );


        remoteWorkTips.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

            }
        );


        document.addEventListener(
            "click",
            function () {

                remoteWorkTips.classList.remove(
                    "active"
                );

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    remoteWorkTips.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (
        remoteWorkTipsClose &&
        remoteWorkTips
    ) {

        remoteWorkTipsClose.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                remoteWorkTips.classList.remove(
                    "active"
                );

            }
        );

    }


    if (
        remoteWorkTipsCloseBottom &&
        remoteWorkTips
    ) {

        remoteWorkTipsCloseBottom.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                remoteWorkTips.classList.remove(
                    "active"
                );

            }
        );

    }


    /* ---------- INTERVIEW PREPARATION ---------- */

    const interviewPreparationButton =
        document.getElementById(
            "interview-preparation-btn"
        );

    const interviewPreparation =
        document.getElementById(
            "interview-preparation"
        );

    const interviewPreparationClose =
        document.getElementById(
            "interview-preparation-close"
        );

    const interviewPreparationCloseBottom =
        document.getElementById(
            "interview-preparation-close-bottom"
        );


    if (
        interviewPreparationButton &&
        interviewPreparation
    ) {

        interviewPreparationButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                interviewPreparation.classList.add(
                    "active"
                );

            }
        );


        interviewPreparation.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

            }
        );


        document.addEventListener(
            "click",
            function () {

                interviewPreparation.classList.remove(
                    "active"
                );

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    interviewPreparation.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (
        interviewPreparationClose &&
        interviewPreparation
    ) {

        interviewPreparationClose.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                interviewPreparation.classList.remove(
                    "active"
                );

            }
        );

    }


    if (
        interviewPreparationCloseBottom &&
        interviewPreparation
    ) {

        interviewPreparationCloseBottom.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                interviewPreparation.classList.remove(
                    "active"
                );

            }
        );

    }


    /* ---------- AI FOR REMOTE CAREERS ---------- */

    const aiRemoteCareersButton =
        document.getElementById(
            "ai-remote-careers-btn"
        );

    const aiRemoteCareers =
        document.getElementById(
            "ai-remote-careers"
        );

    const aiRemoteCareersClose =
        document.getElementById(
            "ai-remote-careers-close"
        );

    const aiRemoteCareersCloseBottom =
        document.getElementById(
            "ai-remote-careers-close-bottom"
        );


    if (
        aiRemoteCareersButton &&
        aiRemoteCareers
    ) {

        aiRemoteCareersButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                aiRemoteCareers.classList.add(
                    "active"
                );

            }
        );


        aiRemoteCareers.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

            }
        );


        document.addEventListener(
            "click",
            function () {

                aiRemoteCareers.classList.remove(
                    "active"
                );

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    aiRemoteCareers.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (
        aiRemoteCareersClose &&
        aiRemoteCareers
    ) {

        aiRemoteCareersClose.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                aiRemoteCareers.classList.remove(
                    "active"
                );

            }
        );

    }


    if (
        aiRemoteCareersCloseBottom &&
        aiRemoteCareers
    ) {

        aiRemoteCareersCloseBottom.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                aiRemoteCareers.classList.remove(
                    "active"
                );

            }
        );

    }


    /* ---------- FREELANCING & CONSULTING ---------- */

    const freelancingConsultingButton =
        document.getElementById(
            "freelancing-consulting-btn"
        );

    const freelancingConsulting =
        document.getElementById(
            "freelancing-consulting"
        );

    const freelancingConsultingClose =
        document.getElementById(
            "freelancing-consulting-close"
        );

    const freelancingConsultingCloseBottom =
        document.getElementById(
            "freelancing-consulting-close-bottom"
        );


    if (
        freelancingConsultingButton &&
        freelancingConsulting
    ) {

        freelancingConsultingButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                freelancingConsulting.classList.add(
                    "active"
                );

            }
        );


        freelancingConsulting.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

            }
        );


        document.addEventListener(
            "click",
            function () {

                freelancingConsulting.classList.remove(
                    "active"
                );

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    freelancingConsulting.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (
        freelancingConsultingClose &&
        freelancingConsulting
    ) {

        freelancingConsultingClose.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                freelancingConsulting.classList.remove(
                    "active"
                );

            }
        );

    }


    if (
        freelancingConsultingCloseBottom &&
        freelancingConsulting
    ) {

        freelancingConsultingCloseBottom.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                freelancingConsulting.classList.remove(
                    "active"
                );

            }
        );

    }


    /* ---------- CV, RESUME & ATS TIPS ---------- */

    const cvAtsTipsButton =
        document.getElementById(
            "cv-ats-tips-btn"
        );

    const cvAtsTips =
        document.getElementById(
            "cv-ats-tips"
        );

    const cvAtsTipsClose =
        document.getElementById(
            "cv-ats-tips-close"
        );

    const cvAtsTipsCloseBottom =
        document.getElementById(
            "cv-ats-tips-close-bottom"
        );


    if (
        cvAtsTipsButton &&
        cvAtsTips
    ) {

        cvAtsTipsButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                cvAtsTips.classList.add(
                    "active"
                );

            }
        );


        cvAtsTips.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

            }
        );


        document.addEventListener(
            "click",
            function () {

                cvAtsTips.classList.remove(
                    "active"
                );

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    cvAtsTips.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (
        cvAtsTipsClose &&
        cvAtsTips
    ) {

        cvAtsTipsClose.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                cvAtsTips.classList.remove(
                    "active"
                );

            }
        );

    }


    if (
        cvAtsTipsCloseBottom &&
        cvAtsTips
    ) {

        cvAtsTipsCloseBottom.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                cvAtsTips.classList.remove(
                    "active"
                );

            }
        );

    }


    /* ---------- POLICY MODALS - FIXED: X top, Close bottom, Outside click, Esc ---------- */
    // Lines 1926-2000 - Handles 4 footer policies

    const policyModals = [
        { btn: "privacy-policy-btn", modal: "privacy-policy", close: "privacy-policy-close", closeBottom: "privacy-policy-close-bottom" },
        { btn: "terms-conditions-btn", modal: "terms-conditions", close: "terms-conditions-close", closeBottom: "terms-conditions-close-bottom" },
        { btn: "refund-policy-btn", modal: "refund-policy", close: "refund-policy-close", closeBottom: "refund-policy-close-bottom" },
        { btn: "cookie-policy-btn", modal: "cookie-policy", close: "cookie-policy-close", closeBottom: "cookie-policy-close-bottom" }
    ];

    policyModals.forEach(function(item) {
        const btn = document.getElementById(item.btn);
        const modal = document.getElementById(item.modal);
        const closeBtn = document.getElementById(item.close);
        const closeBottom = document.getElementById(item.closeBottom);

        if (!btn || !modal) return;

        const modalContent = modal.querySelector(".policy-modal-content");
        if (!modalContent) return;

        // OPEN - Line ~1945
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            modal.classList.add("active");
        });

        // KEEP OPEN WHEN CLICKING INSIDE - Line ~1952
        modalContent.addEventListener("click", function(e) {
            e.stopPropagation();
        });

        // CLOSE - X top-right - Line ~1957
        if (closeBtn) {
            closeBtn.addEventListener("click", function(e) {
                e.preventDefault();
                modal.classList.remove("active");
            });
        }

        // CLOSE - Button at end of scroll - Line ~1965
        if (closeBottom) {
            closeBottom.addEventListener("click", function(e) {
                e.preventDefault();
                modal.classList.remove("active");
            });
        }
    });

    // CLOSE WHEN CLICKING OUTSIDE OVERLAY - Line ~1975
    document.addEventListener("click", function(e) {
        policyModals.forEach(function(item) {
            const modal = document.getElementById(item.modal);
            if (!modal) return;
            if (modal.classList.contains("active") && e.target === modal) {
                modal.classList.remove("active");
            }
        });
    });

    // CLOSE WITH ESC KEY - Line ~1986
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            policyModals.forEach(function(item) {
                const modal = document.getElementById(item.modal);
                if (modal) modal.classList.remove("active");
            });
        }
    });


});
