// static/js/script.js
document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const languageSelector = document.getElementById('language-selector');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    
    // Modal elements
    const aboutLink = document.getElementById('about-link');
    const privacyLink = document.getElementById('privacy-link');
    const termsLink = document.getElementById('terms-link');
    const aboutModal = document.getElementById('about-modal');
    const privacyModal = document.getElementById('privacy-modal');
    const termsModal = document.getElementById('terms-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    
    // Language translations for UI elements
    const translations = {
        en: {
            placeholder: "Type your legal question here...",
            intro: "Your AI Legal Assistant for Moroccan Law",
            description: "Ask questions about Moroccan legal codes, procedures, and regulations.",
            disclaimer: "This is an AI assistant and should not replace professional legal advice.",
            chips: {
                business: "Starting a business",
                family: "Family code",
                property: "Property laws",
                divorce: "Divorce procedures"
            },
            thinking: "Thinking",
            errorMessage: "Sorry, there was an error processing your request. Please try again later."
        },
        fr: {
            placeholder: "Posez votre question juridique ici...",
            intro: "Votre assistant juridique IA pour le droit marocain",
            description: "Posez des questions sur les codes, procédures et réglementations juridiques marocains.",
            disclaimer: "Ceci est un assistant IA et ne doit pas remplacer un avis juridique professionnel.",
            chips: {
                business: "Créer une entreprise",
                family: "Code de la famille",
                property: "Lois immobilières",
                divorce: "Procédures de divorce"
            },
            thinking: "Réflexion en cours",
            errorMessage: "Désolé, une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer plus tard."
        },
        ar: {
            placeholder: "اكتب سؤالك القانوني هنا...",
            intro: "مساعدك القانوني بالذكاء الاصطناعي للقانون المغربي",
            description: "اطرح أسئلة حول القوانين والإجراءات واللوائح المغربية.",
            disclaimer: "هذا مساعد ذكاء اصطناعي ولا ينبغي أن يحل محل المشورة القانونية المهنية.",
            chips: {
                business: "بدء عمل تجاري",
                family: "مدونة الأسرة",
                property: "قوانين العقارات",
                divorce: "إجراءات الطلاق"
            },
            thinking: "جاري التفكير",
            errorMessage: "عذرًا، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى لاحقًا."
        }
    };
    
    // Chat history (useful for summarizing context)
    let chatHistory = [];
    const MAX_HISTORY_LENGTH = 10;
    
    // Initialize to detect user's browser language
    function initializeLanguage() {
        const browserLang = navigator.language.split('-')[0]; // Get the language code
        if (browserLang === 'fr') {
            languageSelector.value = 'fr';
            changeLanguage('fr');
        } else if (browserLang === 'ar') {
            languageSelector.value = 'ar';
            changeLanguage('ar');
        }
    }
    
    // Handle language change
    languageSelector.addEventListener('change', function() {
        const lang = this.value;
        changeLanguage(lang);
    });
    
    function changeLanguage(lang) {
        // Update placeholder text
        userInput.placeholder = translations[lang].placeholder;
        
        // Update intro text
        document.querySelector('#intro-text h2').textContent = translations[lang].intro;
        document.querySelector('#intro-text p').textContent = translations[lang].description;
        document.querySelector('#intro-text .disclaimer').textContent = translations[lang].disclaimer;
        
        // Update suggestion chips
        const chips = document.querySelectorAll('.suggestion-chip');
        chips[0].textContent = translations[lang].chips.business;
        chips[1].textContent = translations[lang].chips.family;
        chips[2].textContent = translations[lang].chips.property;
        chips[3].textContent = translations[lang].chips.divorce;
        
        // Set text direction for Arabic
        if (lang === 'ar') {
            document.documentElement.setAttribute('lang', 'ar');
            document.body.classList.add('rtl');
        } else {
            document.documentElement.setAttribute('lang', lang);
            document.body.classList.remove('rtl');
        }
    }
    
    // Handle suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const query = this.getAttribute('data-query');
            userInput.value = query;
            sendMessage();
        });
    });
    
    // Send message when user clicks send button
    sendButton.addEventListener('click', sendMessage);
    
    // Send message when user presses Enter key (without Shift)
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Focus on input when page loads
    userInput.focus();
    
    // Handle modal dialogs
    aboutLink.addEventListener('click', function(e) {
        e.preventDefault();
        aboutModal.style.display = 'block';
    });
    
    privacyLink.addEventListener('click', function(e) {
        e.preventDefault();
        privacyModal.style.display = 'block';
    });
    
    termsLink.addEventListener('click', function(e) {
        e.preventDefault();
        termsModal.style.display = 'block';
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            aboutModal.style.display = 'none';
            privacyModal.style.display = 'none';
            termsModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(e) {
        if (e.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
        if (e.target === privacyModal) {
            privacyModal.style.display = 'none';
        }
        if (e.target === termsModal) {
            termsModal.style.display = 'none';
        }
    });
    
    function sendMessage() {
        const message = userInput.value.trim();
        
        if (message === '') return;
        
        // Add user message to chat
        addMessage('user', message);
        
        // Add to chat history
        chatHistory.push({role: 'user', content: message});
        if (chatHistory.length > MAX_HISTORY_LENGTH) {
            chatHistory.shift(); // Remove oldest message if history is too long
        }
        
        // Clear input field
        userInput.value = '';
        
        // Show loading indicator
        const lang = languageSelector.value;
        const loadingId = showLoading(translations[lang].thinking);
        
        // Send message to server
        fetch('/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading indicator
            removeLoading(loadingId);
            
            if (data.error) {
                // Show error message
                const lang = languageSelector.value;
                addMessage('bot', translations[lang].errorMessage);
                console.error('Error:', data.error);
            } else {
                // Add bot response to chat
                addMessage('bot', data.response);
                
                // Add to chat history
                chatHistory.push({role: 'assistant', content: data.response});
                if (chatHistory.length > MAX_HISTORY_LENGTH) {
                    chatHistory.shift();
                }
            }
            
            // Focus back on input field
            userInput.focus();
        })
        .catch(error => {
            // Remove loading indicator
            removeLoading(loadingId);
            
            // Show error message
            const lang = languageSelector.value;
            addMessage('bot', translations[lang].errorMessage);
            console.error('Connection error:', error);
            
            // Focus back on input field
            userInput.focus();
        });
    }
    
    function addMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        
        if (sender === 'user') {
            messageDiv.classList.add('user-message');
        } else {
            messageDiv.classList.add('bot-message');
        }
        
        const avatar = document.createElement('div');
        avatar.classList.add('message-avatar');
        
        const icon = document.createElement('i');
        icon.classList.add('fas');
        
        if (sender === 'user') {
            icon.classList.add('fa-user');
        } else {
            icon.classList.add('fa-robot');
        }
        
        avatar.appendChild(icon);
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        
        // Process message for markdown-like formatting
        message = processMessage(message);
        
        content.innerHTML = message;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        scrollToBottom();
    }
    
    function processMessage(message) {
        // Convert line breaks to <br>
        message = message.replace(/\n/g, '<br>');
        
        // Process code blocks (```)
        message = message.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Process inline code (`)
        message = message.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Process bold (**text**)
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Process italic (*text*)
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Process links
        message = message.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Process unordered lists
        message = message.replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>');
        message = message.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
        
        // Process ordered lists
        message = message.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<li>$2</li>');
        message = message.replace(/(<li>.*?<\/li>)/gs, '<ol>$1</ol>');
        
        return message;
    }
    
    function showLoading(thinkingText = 'Thinking') {
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'bot-message', 'loading-message');
        
        const avatar = document.createElement('div');
        avatar.classList.add('message-avatar');
        
        const icon = document.createElement('i');
        icon.classList.add('fas', 'fa-robot');
        avatar.appendChild(icon);
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        content.innerHTML = `${thinkingText}<span class="loading-dots"></span>`;
        
        loadingDiv.appendChild(avatar);
        loadingDiv.appendChild(content);
        
        chatMessages.appendChild(loadingDiv);
        
        // Scroll to bottom
        scrollToBottom();
        
        return Date.now(); // Return unique ID for this loading indicator
    }
    
    function removeLoading(id) {
        const loadingMessages = document.querySelectorAll('.loading-message');
        if (loadingMessages.length > 0) {
            loadingMessages[loadingMessages.length - 1].remove();
        }
    }
    
    function scrollToBottom() {
        // Smooth scroll to bottom of chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Initialize language
    initializeLanguage();
});
