/**
 * GoodWatch Main JavaScript
 * Handles newsletter subscription and FAQ accordion
 */

(function() {
    'use strict';

    // Supabase configuration (goodwatch-web project)
    const SUPABASE_URL = 'https://zaoihuwiovhakapdbhbi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphb2lodXdpb3ZoYWthcGRiaGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMjksImV4cCI6MjA4NTQyMDEyOX0.n6_QQpNs5fm3sv9LRZmFm4S3ZIk95Rl_xvjaPcVug8Q';

    /**
     * Initialize all functionality when DOM is ready
     */
    document.addEventListener('DOMContentLoaded', function() {
        initNewsletterForm();
        initFAQAccordion();
        initSmoothScroll();
    });

    /**
     * Newsletter Form Handler
     */
    function initNewsletterForm() {
        const form = document.getElementById('newsletter-form');
        const emailInput = document.getElementById('newsletter-email');
        const submitButton = document.getElementById('newsletter-submit');
        const messageDiv = document.getElementById('newsletter-message');

        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = emailInput.value.trim();

            // Client-side validation
            if (!isValidEmail(email)) {
                showMessage('Please enter a valid email address.', 'error');
                return;
            }

            // Set loading state
            setLoadingState(true);

            try {
                const response = await subscribeToNewsletter(email);

                if (response.success) {
                    // Hide the form entirely and show a persistent success state
                    form.classList.add('hidden');
                    const finePrint = document.getElementById('newsletter-fine-print');
                    if (finePrint) finePrint.classList.add('hidden');
                    showMessage("You're in. First email drops this Sunday.", 'success', false);
                } else {
                    showMessage(response.message || 'Something went wrong. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                showMessage('Unable to subscribe. Please try again later.', 'error');
            } finally {
                setLoadingState(false);
            }
        });

        /**
         * Validate email format
         */
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        /**
         * Set loading state for form
         */
        function setLoadingState(loading) {
            form.classList.toggle('loading', loading);
            submitButton.disabled = loading;
            emailInput.disabled = loading;

            if (loading) {
                submitButton.innerHTML = '<span class="spinner"></span>';
            } else {
                submitButton.innerHTML = 'Subscribe';
            }
        }

        /**
         * Show success or error message
         */
        function showMessage(text, type, autoHide) {
            messageDiv.textContent = text;
            messageDiv.className = 'text-sm mb-4 font-medium';

            if (type === 'success') {
                messageDiv.classList.add('text-green-400');
            } else if (type === 'error') {
                messageDiv.classList.add('text-red-400');
            }

            messageDiv.classList.remove('hidden');

            // Auto-hide error messages after 5 seconds; success stays visible
            if (autoHide !== false && type === 'error') {
                setTimeout(() => {
                    messageDiv.classList.add('hidden');
                }, 5000);
            }
        }
    }

    /**
     * Subscribe email to Supabase newsletter_subscribers table
     */
    async function subscribeToNewsletter(email) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    email: email,
                    source: 'website'
                })
            });

            if (response.ok || response.status === 201) {
                return { success: true };
            }

            // Handle duplicate email (409 Conflict or 23505 unique constraint)
            if (response.status === 409) {
                return { success: false, message: "You're already subscribed!" };
            }

            // Parse error response
            const errorData = await response.json().catch(() => ({}));

            // Check for unique constraint violation
            if (errorData.code === '23505' || errorData.message?.includes('duplicate')) {
                return { success: false, message: "You're already subscribed!" };
            }

            return { success: false, message: 'Unable to subscribe. Please try again.' };

        } catch (error) {
            console.error('Supabase error:', error);
            throw error;
        }
    }

    /**
     * FAQ Accordion Handler
     */
    function initFAQAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');

        faqItems.forEach(item => {
            const trigger = item.querySelector('.faq-trigger');
            const content = item.querySelector('.faq-content');

            if (!trigger || !content) return;

            trigger.addEventListener('click', function() {
                const isActive = item.classList.contains('active');

                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherContent = otherItem.querySelector('.faq-content');
                        if (otherContent) {
                            otherContent.classList.add('hidden');
                        }
                    }
                });

                // Toggle current item
                item.classList.toggle('active', !isActive);
                content.classList.toggle('hidden', isActive);
            });

            // Keyboard accessibility
            trigger.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    trigger.click();
                }
            });
        });
    }

    /**
     * Smooth scroll for anchor links
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');

                if (targetId === '#') return;

                const target = document.querySelector(targetId);

                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update URL without scrolling
                    history.pushState(null, null, targetId);
                }
            });
        });
    }

    /**
     * Utility: Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Track page visibility for analytics
     */
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // Page became visible
        }
    });

})();
