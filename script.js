document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'flex';
    
    // Hide after 2 seconds
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 2000);

    // Initialize animations after a short delay
    setTimeout(() => {
        const elements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale');
        elements.forEach(element => {
            element.style.opacity = '1';
        });
        handleScrollAnimation();
    }, 2100); // Start animations right after loading screen

    // Scroll animation handler
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe all scroll-animate elements
    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el));

    // Initialize state
    let cardData = [];
    let currentCardIndex = 0;
    let isFlipped = false;
    let reviewedCards = 0;
    let masteredCards = 0;
    let studyStartTime = new Date();
    let editingCardIndex = -1;
    let sessionStats = {
        total: 0,
        successful: 0,
        failed: 0,
        failedCards: []
    };
    let addedCards = [];
    let editedCards = [];

    // Load streak data
    function loadStreakData() {
        const streakData = JSON.parse(localStorage.getItem('streakData') || '{}');
        const today = new Date().toLocaleDateString();
        
        // Check if all cards are completed for today
        const allCardsCompleted = cardData.every(card => card.reviewCount > 0);
        
        // Update streak for today with completion status
        streakData[today] = {
            studied: true,
            completed: allCardsCompleted
        };
        
        // Remove old streak data (older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        Object.keys(streakData).forEach(date => {
            if (new Date(date) < sevenDaysAgo) {
                delete streakData[date];
            }
        });
        
        localStorage.setItem('streakData', JSON.stringify(streakData));
        updateStreakDisplay(streakData);
    }

    // Update streak display
    function updateStreakDisplay(streakData) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();
        
        days.forEach((day, index) => {
            const streakDay = document.querySelector(`[data-day="${day}"]`);
            const date = new Date();
            date.setDate(date.getDate() - (today - index));
            const dateStr = date.toLocaleDateString();
            
            if (streakData[dateStr]) {
                if (streakData[dateStr].completed) {
                    streakDay.classList.add('completed');
                } else {
                    streakDay.classList.add('active');
                }
            } else {
                streakDay.classList.remove('active', 'completed');
            }
            
            if (index === today) {
                streakDay.classList.add('today');
            } else {
                streakDay.classList.remove('today');
            }
        });
    }
    
    // DOM elements
    const flashcardElement = document.getElementById('flashcard');
    const questionText = document.querySelector('.question-text');
    const answerText = document.querySelector('.answer-text');
    const difficultyButtons = document.getElementById('difficultyButtons');
    const nextBtn = document.getElementById('nextBtn');
    const showAnalysisBtn = document.getElementById('showAnalysisBtn');
    const analysisModal = document.getElementById('analysisModal');
    const closeAnalysisBtn = document.getElementById('closeAnalysisBtn');
    const restartBtn = document.getElementById('restartBtn');
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleSidebar = document.getElementById('darkModeToggleSidebar');
    const helpBtn = document.getElementById('helpBtn');
    const shortcutsModal = document.getElementById('shortcutsModal');
    const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');
    const editCardBtn = document.getElementById('editCardBtn');
    const progressBar = document.querySelector('.progress-bar');
    const cardCounter = document.querySelector('.card-counter');
    const addCardBtn = document.getElementById('addCardBtn');
    const cardModal = document.getElementById('cardModal');
    const cardForm = document.getElementById('cardForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const resetAllBtn = document.getElementById('resetAllBtn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const helpBtnSidebar = document.getElementById('helpBtnSidebar');
    const resetAllBtnSidebar = document.getElementById('resetAllBtnSidebar');
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

    console.log('Theme Toggle:', themeToggle);
    console.log('Theme Toggle Sidebar:', themeToggleSidebar);
    console.log('Sidebar elements:', {
        sidebar,
        mainContent,
        sidebarToggle,
        themeToggleSidebar,
        helpBtnSidebar,
        resetAllBtnSidebar,
        mobileSidebarToggle
    });

    // Theme handling
    function initTheme() {
        console.log('Initializing theme...');
        const savedTheme = localStorage.getItem('theme') || 'light';
        console.log('Saved theme:', savedTheme);

        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(savedTheme);

        // Update both toggle states
        if (themeToggleSidebar) {
            // Now themeToggleSidebar is the parent div, the checkbox is inside it
            // const checkbox = themeToggleSidebar.querySelector('#darkModeToggleSidebar'); // REMOVED
            // if(checkbox) { // REMOVED
            //     checkbox.checked = (savedTheme === 'dark'); // REMOVED
            //     console.log('Sidebar checkbox state set to:', checkbox.checked); // REMOVED
            // } // REMOVED
            // Update sidebar icon color based on theme
            const sidebarIcon = themeToggleSidebar.querySelector('.fa-moon');
            if (sidebarIcon) {
                // Remove previous theme specific classes if any
                sidebarIcon.classList.remove('text-blue-300', 'text-yellow-500');
                // Add class based on current theme (icon typically represents the opposite theme when sidebar is open)
                 if (savedTheme === 'dark') {
                    sidebarIcon.classList.add('text-yellow-500'); // Show sun-like color in dark mode
                } else {
                    sidebarIcon.classList.add('text-blue-300'); // Show moon-like color in light mode
                }
                 console.log('Sidebar icon color updated for theme:', savedTheme);
            }
        }

        if (themeToggle) {
            const sunIcon = themeToggle.querySelector('.fa-sun');
            const moonIcon = themeToggle.querySelector('.fa-moon');
            if (sunIcon && moonIcon) {
                sunIcon.style.display = savedTheme === 'dark' ? 'none' : 'block';
                moonIcon.style.display = savedTheme === 'dark' ? 'block' : 'none';
                 console.log('Header icons visibility updated for theme:', savedTheme);
            }
        }
    }

    function toggleTheme() {
        console.log('Toggling theme...');
        const isDark = document.documentElement.classList.contains('dark');
        console.log('Current theme is dark:', isDark);
        const newTheme = isDark ? 'light' : 'dark';
        console.log('New theme will be:', newTheme);

        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
        console.log('Theme class added to documentElement and saved to localStorage.');

        // Update both toggle states
        if (themeToggleSidebar) {
             // Now themeToggleSidebar is the parent div, the checkbox is inside it
            // const checkbox = themeToggleSidebar.querySelector('#darkModeToggleSidebar'); // REMOVED
             // if(checkbox) { // REMOVED
            //     checkbox.checked = (newTheme === 'dark'); // REMOVED
            //     console.log('Sidebar checkbox state updated to:', checkbox.checked); // REMOVED
            // } // REMOVED
             // Update sidebar icon color based on theme
            const sidebarIcon = themeToggleSidebar.querySelector('.fa-moon');
            if (sidebarIcon) {
                 // Remove previous theme specific classes if any
                sidebarIcon.classList.remove('text-blue-300', 'text-yellow-500');
                // Add class based on current theme
                if (newTheme === 'dark') {
                    sidebarIcon.classList.add('text-yellow-500'); // Show sun-like color in dark mode
                } else {
                    sidebarIcon.classList.add('text-blue-300'); // Show moon-like color in light mode
                }
                 console.log('Sidebar icon color updated for theme:', newTheme);
            }
        }

        if (themeToggle) {
            const sunIcon = themeToggle.querySelector('.fa-sun');
            const moonIcon = themeToggle.querySelector('.fa-moon');
            if (sunIcon && moonIcon) {
                sunIcon.style.display = newTheme === 'dark' ? 'none' : 'block';
                moonIcon.style.display = newTheme === 'dark' ? 'block' : 'none';
                 console.log('Header icons visibility updated for theme:', newTheme);
            }
        }
    }

    // Initialize theme
    initTheme();

    // Load cards from localStorage
    function loadCards() {
        const savedCards = localStorage.getItem('flashcards');
        const savedAddedCards = localStorage.getItem('addedCards');
        const savedEditedCards = localStorage.getItem('editedCards');
        
        if (savedAddedCards) {
            addedCards = JSON.parse(savedAddedCards);
            updateAddedCardsList();
        }
        
        if (savedEditedCards) {
            editedCards = JSON.parse(savedEditedCards);
            updateEditedCardsList();
        }

        if (savedCards) {
            cardData = JSON.parse(savedCards);
        } else {
            // Default cards
            cardData = [
                { question: "What is the capital of India?", answer: "New Delhi", category: "Geography" },
                { question: "Who is known as the Father of the Nation in India?", answer: "Mahatma Gandhi", category: "History" },
                { question: "What is the national flower of India?", answer: "Lotus", category: "General Knowledge" },
                { question: "Which is the largest democracy in the world?", answer: "India", category: "Politics" },
                { question: "What is the currency of India?", answer: "Indian Rupee (INR)", category: "Economics" },
                { question: "Which river is known as the lifeline of India?", answer: "Ganga", category: "Geography" },
                { question: "Who wrote the Indian National Anthem?", answer: "Rabindranath Tagore", category: "Literature" },
                { question: "What is the highest mountain peak in India?", answer: "Kanchenjunga", category: "Geography" },
                { question: "Which is the largest state in India by area?", answer: "Rajasthan", category: "Geography" },
                { question: "What is the national animal of India?", answer: "Bengal Tiger", category: "General Knowledge" }
            ].map(card => ({
                ...card,
                interval: 1,
                repetition: 0,
                easeFactor: 2.5,
                nextReview: new Date(),
                lastReviewed: null,
                reviewCount: 0,
                successCount: 0
            }));
            saveCards();
        }
        updateCategoryFilter();
    loadCard(currentCardIndex);
    }

    // Save cards to localStorage
    function saveCards() {
        localStorage.setItem('flashcards', JSON.stringify(cardData));
    }

    // Update category filter dropdown
    function updateCategoryFilter() {
        const categories = [...new Set(cardData.map(card => card.category))];
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(category => `<option value="${category}">${category}</option>`).join('');
    }

    // Filter cards based on search and category
    function filterCards() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        
        return cardData.filter(card => {
            const matchesSearch = card.question.toLowerCase().includes(searchTerm) ||
                                card.answer.toLowerCase().includes(searchTerm);
            const matchesCategory = !category || card.category === category;
            return matchesSearch && matchesCategory;
        });
    }

    // Load card at index
    function loadCard(index) {
        const filteredCards = filterCards();
        if (index >= 0 && index < filteredCards.length) {
            const card = filteredCards[index];
            questionText.textContent = card.question;
            answerText.textContent = card.answer;
            answerText.style.opacity = '0'; // Initially hide the answer
            answerText.style.transition = 'opacity 0.3s ease'; // Add transition for smooth fade-in
            
            const progress = ((index + 1) / filteredCards.length) * 100;
            progressBar.style.width = `${progress}%`;
            cardCounter.textContent = `${index + 1}/${filteredCards.length}`;
            
            flashcardElement.classList.remove('flipped');
            isFlipped = false;
            difficultyButtons.classList.add('hidden');
            nextBtn.classList.add('hidden');
        } else {
            questionText.textContent = "No cards to review!";
            answerText.textContent = "Add some cards or adjust your filters.";
            answerText.style.opacity = '1'; // Make sure message is visible
            answerText.style.transition = 'none'; // Remove transition for immediate visibility of the message
            difficultyButtons.classList.add('hidden');
            nextBtn.classList.add('hidden');
        }
    }
    
    // Show modal for adding/editing cards
    function showCardModal(index = -1) {
        editingCardIndex = index;
        const modalTitle = document.getElementById('modalTitle');
        const questionInput = document.getElementById('questionInput');
        const answerInput = document.getElementById('answerInput');
        const categoryInput = document.getElementById('categoryInput');

        if (index >= 0) {
            modalTitle.textContent = 'Edit Card';
            const card = cardData[index];
            questionInput.value = card.question;
            answerInput.value = card.answer;
            categoryInput.value = card.category;
        } else {
            modalTitle.textContent = 'Add New Card';
            questionInput.value = '';
            answerInput.value = '';
            categoryInput.value = '';
        }

        cardModal.classList.remove('hidden');
    }

    // Update added cards list
    function updateAddedCardsList() {
        const addedCardsList = document.getElementById('addedCardsList');
        if (addedCards.length === 0) {
            addedCardsList.innerHTML = '<div class="text-sm text-gray-600 dark:text-gray-400 italic">No cards added yet</div>';
            return;
        }
        
        addedCardsList.innerHTML = addedCards.map(card => `
            <div class="bg-white dark:bg-gray-800 rounded p-2 shadow-sm">
                <div class="text-sm font-medium text-gray-800 dark:text-gray-200">${card.question}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${new Date(card.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    }

    // Update edited cards list
    function updateEditedCardsList() {
        const editedCardsList = document.getElementById('editedCardsList');
        if (editedCards.length === 0) {
            editedCardsList.innerHTML = '<div class="text-sm text-gray-600 dark:text-gray-400 italic">No cards edited yet</div>';
            return;
        }
        
        editedCardsList.innerHTML = editedCards.map(card => `
            <div class="bg-white dark:bg-gray-800 rounded p-2 shadow-sm">
                <div class="text-sm font-medium text-gray-800 dark:text-gray-200">${card.question}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${new Date(card.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    }

    // Handle card form submission
    cardForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const questionInput = document.getElementById('questionInput');
        const answerInput = document.getElementById('answerInput');
        const categoryInput = document.getElementById('categoryInput');

        const newCard = {
            question: questionInput.value,
            answer: answerInput.value,
            category: categoryInput.value || 'Uncategorized',
            interval: 1,
            repetition: 0,
            easeFactor: 2.5,
            nextReview: new Date(),
            lastReviewed: null,
            reviewCount: 0,
            successCount: 0
        };

        if (editingCardIndex >= 0) {
            cardData[editingCardIndex] = { ...cardData[editingCardIndex], ...newCard };
            showToast('Card updated successfully!');
            
            // Add to edited cards list
            editedCards.unshift({
                question: newCard.question,
                timestamp: new Date().toISOString()
            });
            if (editedCards.length > 5) editedCards.pop();
            localStorage.setItem('editedCards', JSON.stringify(editedCards));
            updateEditedCardsList();
        } else {
            cardData.push(newCard);
            showToast('Card added successfully!');
            
            // Add to added cards list
            addedCards.unshift({
                question: newCard.question,
                timestamp: new Date().toISOString()
            });
            if (addedCards.length > 5) addedCards.pop();
            localStorage.setItem('addedCards', JSON.stringify(addedCards));
            updateAddedCardsList();
        }

        saveCards();
        updateCategoryFilter();
        cardModal.classList.add('hidden');
        loadCard(currentCardIndex);
    });

    // Toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    // Update statistics
    function updateStats() {
        const now = new Date();
        const studyTime = Math.round((now - studyStartTime) / 60000); // in minutes
        
        const totalReviews = cardData.reduce((sum, card) => sum + card.reviewCount, 0);
        const totalSuccess = cardData.reduce((sum, card) => sum + card.successCount, 0);
        const successRate = totalReviews ? Math.round((totalSuccess / totalReviews) * 100) : 0;
        
        // Show all cards as due for today
        const dueToday = cardData.length;

        document.getElementById('successRate').textContent = `${successRate}%`;
        document.getElementById('dueToday').textContent = dueToday;
        document.getElementById('studyTime').textContent = `${studyTime} min`;
        
        // Update streak
        loadStreakData();
    }

    // Event listeners
    if (themeToggle) {
        console.log('Adding click listener to header toggle');
        themeToggle.addEventListener('click', (e) => {
            console.log('Header toggle clicked');
            toggleTheme();
        });
    }
    
    if (themeToggleSidebar) {
        console.log('Adding change listener to sidebar toggle');
        themeToggleSidebar.addEventListener('change', (e) => {
            console.log('Sidebar toggle changed');
            toggleTheme();
        });
    }
    helpBtn.addEventListener('click', () => shortcutsModal.classList.remove('hidden'));
    closeShortcutsBtn.addEventListener('click', () => shortcutsModal.classList.add('hidden'));
    
    // Reset All functionality
    document.getElementById('resetAllBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all data? This will delete all cards and statistics.')) {
            // Reset all data
            cardData = [];
            currentCardIndex = 0;
            isFlipped = false;
            reviewedCards = 0;
            masteredCards = 0;
            studyStartTime = new Date();
            sessionStats = {
                total: 0,
                successful: 0,
                failed: 0,
                failedCards: []
            };
            
            // Clear recent changes
            addedCards = [];
            editedCards = [];
            
            // Clear localStorage
            localStorage.removeItem('flashcards');
            localStorage.removeItem('addedCards');
            localStorage.removeItem('editedCards');
            
            // Reset UI
            loadCards();
            updateStats();
            showAnalysisBtn.classList.add('hidden');
            
            // Reset recent changes section
            document.getElementById('addedCardsList').innerHTML = '<div class="text-sm text-gray-600 dark:text-gray-400 italic">No cards added yet</div>';
            document.getElementById('editedCardsList').innerHTML = '<div class="text-sm text-gray-600 dark:text-gray-400 italic">No cards edited yet</div>';
            
            showToast('All data has been reset!');
        }
    });

    restartBtn.addEventListener('click', () => {
        console.log('Restart button clicked!');
        sessionStats = {
            total: 0,
            successful: 0,
            failed: 0,
            failedCards: []
        };
        currentCardIndex = 0;
        isFlipped = false;
        reviewedCards = 0;
        masteredCards = 0;
        studyStartTime = new Date();
        loadCard(currentCardIndex);
        updateStats();
        showAnalysisBtn.classList.add('hidden');
        showToast('Session restarted!');
    });
    addCardBtn.addEventListener('click', () => showCardModal());
    editCardBtn.addEventListener('click', () => {
        const filteredCards = filterCards();
        if (filteredCards.length > 0) {
            showCardModal(currentCardIndex);
        } else {
            showToast('No cards to edit!');
        }
    });
    cancelBtn.addEventListener('click', () => cardModal.classList.add('hidden'));
    showAnalysisBtn.addEventListener('click', () => {
        const totalCardsCount = document.getElementById('totalCardsCount');
        const successfulCardsCount = document.getElementById('successfulCardsCount');
        const failedCardsCount = document.getElementById('failedCardsCount');
        const failedCardsList = document.getElementById('failedCardsList');

        totalCardsCount.textContent = sessionStats.total;
        successfulCardsCount.textContent = sessionStats.successful;
        failedCardsCount.textContent = sessionStats.failed;

        failedCardsList.innerHTML = sessionStats.failedCards.map(card => `
            <div class="bg-red-50 dark:bg-red-900/50 p-3 rounded-lg">
                <div class="font-medium text-red-700 dark:text-red-300">${card.question}</div>
                <div class="text-sm text-red-600 dark:text-red-400">${card.answer}</div>
            </div>
        `).join('');

        analysisModal.classList.remove('hidden');
    });
    closeAnalysisBtn.addEventListener('click', () => analysisModal.classList.add('hidden'));
    searchInput.addEventListener('input', () => {
        currentCardIndex = 0;
        loadCard(currentCardIndex);
    });
    categoryFilter.addEventListener('change', () => {
        currentCardIndex = 0;
        loadCard(currentCardIndex);
    });

    // Card interactions
    flashcardElement.addEventListener('click', () => {
        console.log('Flashcard clicked');
        if (!isFlipped) {
            console.log('Flipping card');
            flashcardElement.classList.add('flipped');
            isFlipped = true;
            
            // Delay showing the answer until after the flip animation starts
            setTimeout(() => {
                answerText.style.opacity = '1'; // Fade in the answer
            }, 300); // Delay for half of the flip animation duration (0.6s)

            difficultyButtons.classList.remove('hidden');
        }
    });

    nextBtn.addEventListener('click', () => {
        console.log('Next button clicked');
        isFlipped = false; // Reset flip state for the next card
        flashcardElement.classList.remove('flipped'); // Ensure next card starts unflipped
        difficultyButtons.classList.add('hidden'); // Hide difficulty buttons
        nextBtn.classList.add('hidden'); // Hide next button
        
        // Clear card content immediately after starting the un-flip animation
        questionText.textContent = '';
        answerText.textContent = '';

        // Wait for the un-flip animation to complete before loading the next card
        setTimeout(() => {
            currentCardIndex++;
            if (currentCardIndex < cardData.length) {
                loadCard(currentCardIndex);
            } else {
                loadCard(-1); // Handle end of cards, maybe show a completion message
            }
        }, 650); // Delay slightly longer than the flip animation (0.6s)
    });

    document.querySelectorAll('.difficulty-btn').forEach(button => {
        button.addEventListener('click', function() {
            const difficulty = parseInt(this.getAttribute('data-difficulty'));
            const filteredCards = filterCards();
            const card = filteredCards[currentCardIndex];
            const originalCardIndex = cardData.findIndex(c => c.question === card.question);
            
            if (originalCardIndex === -1) return;
            
            const originalCard = cardData[originalCardIndex];
            originalCard.reviewCount++;
            sessionStats.total++;
            reviewedCards++;
            
            if (difficulty >= 3) {
                originalCard.repetition++;
                originalCard.successCount++;
                sessionStats.successful++;
                
                if (originalCard.repetition === 1) {
                    originalCard.interval = 1;
                } else if (originalCard.repetition === 2) {
                    originalCard.interval = 3;
                } else {
                    originalCard.interval = Math.round(originalCard.interval * originalCard.easeFactor);
                }
                
                if (difficulty === 5) {
                    originalCard.easeFactor += 0.1;
                } else if (difficulty === 3) {
                    originalCard.easeFactor = Math.max(1.3, originalCard.easeFactor - 0.15);
                }
                
                masteredCards++;
                flashcardElement.classList.add('correct-animation');
            } else {
                originalCard.repetition = 0;
                originalCard.interval = 1;
                originalCard.easeFactor = Math.max(1.3, originalCard.easeFactor - 0.2);
                sessionStats.failed++;
                sessionStats.failedCards.push({
                    question: originalCard.question,
                    answer: originalCard.answer
                });
            }
            
            originalCard.lastReviewed = new Date();
            const nextReviewDate = new Date();
            nextReviewDate.setDate(nextReviewDate.getDate() + originalCard.interval);
            originalCard.nextReview = nextReviewDate;
            
            saveCards();
            nextBtn.classList.remove('hidden'); // Show next button after difficulty is selected
            showAnalysisBtn.classList.remove('hidden');
            difficultyButtons.classList.add('hidden');
            updateStats();
            
            setTimeout(() => {
                flashcardElement.classList.remove('correct-animation');
            }, 500);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === ' ' && !cardModal.classList.contains('hidden')) return;
        
        switch(e.key) {
            case '1': // 1 for Easy
                if (isFlipped) document.querySelector('[data-difficulty="5"]').click();
                break;
            case '2': // 2 for Good
                if (isFlipped) document.querySelector('[data-difficulty="3"]').click();
                break;
            case '3': // 3 for Hard
                if (isFlipped) document.querySelector('[data-difficulty="1"]').click();
                break;
            case 'n': // N for Next
                if (!nextBtn.classList.contains('hidden')) nextBtn.click();
                break;
        }
    });

    // Initialize
    loadCards();
    updateStreakDays();
    updateStats();
    updateGoals();
    updateCardChanges();

    // Add missing functions
    function updateStreakDays() {
        const streakData = JSON.parse(localStorage.getItem('streakData') || '{}');
        updateStreakDisplay(streakData);
    }

    function updateGoals() {
        // Update progress bars
        const cardsProgress = document.querySelector('.bg-green-500');
        const timeProgress = document.querySelector('.bg-blue-500');
        const accuracyProgress = document.querySelector('.bg-purple-500');

        if (cardsProgress) cardsProgress.style.width = '45%';
        if (timeProgress) timeProgress.style.width = '60%';
        if (accuracyProgress) accuracyProgress.style.width = '75%';
    }

    function updateCardChanges() {
        updateAddedCardsList();
        updateEditedCardsList();
    }

    // Scroll Animation
    function handleScrollAnimation() {
        const elements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementBottom = element.getBoundingClientRect().bottom;
            const isVisible = (elementTop < window.innerHeight - 100) && (elementBottom > 0);
            
            if (isVisible) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        });
    }

    // Add scroll event listener
    window.addEventListener('scroll', handleScrollAnimation);
    // Initial check for elements in view
    window.addEventListener('load', () => {
        // Make all elements visible first
        const elements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale');
        elements.forEach(element => {
            element.style.opacity = '1';
        });
        // Then check for animations
        handleScrollAnimation();
    });

    // Sidebar functionality
    if (sidebarToggle && sidebar && mainContent) {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                // Desktop view
                sidebar.classList.remove('open');
                sidebar.classList.add('collapsed');
                mainContent.classList.add('shifted');
                document.body.classList.remove('sidebar-open');
            } else {
                // Mobile view: Do not set state on resize, rely on toggle
                // sidebar.classList.remove('collapsed'); // Removed
                // sidebar.classList.remove('open'); // Removed
                // mainContent.classList.remove('shifted'); // Removed
                // document.body.classList.remove('sidebar-open'); // Removed
            }
        };

        // Initial setup
        handleResize();

        // Toggle sidebar (Original sidebar toggle - primarily for desktop collapsed state)
        sidebarToggle.addEventListener('click', () => {
            console.log('Sidebar toggle clicked (Desktop)');
             if (window.innerWidth > 768) {
                // Desktop behavior
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('shifted');
            }
            // Mobile behavior handled by the new button
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                !mobileSidebarToggle.contains(e.target) &&
                !sidebarCloseBtn.contains(e.target)) { // Also check if click is on the close button
                sidebar.classList.remove('open');
                document.body.classList.remove('sidebar-open');
            }
        });

        // Handle window resize
        window.addEventListener('resize', handleResize);
    }

    // New Mobile Sidebar Toggle functionality
    if (mobileSidebarToggle && sidebar && mainContent) {
        mobileSidebarToggle.addEventListener('click', () => {
            console.log('Mobile sidebar toggle clicked');
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('open');
                document.body.classList.toggle('sidebar-open');
            }
        });
    }

    // Sidebar Close Button functionality (Mobile)
    if (sidebarCloseBtn && sidebar && mainContent) {
        sidebarCloseBtn.addEventListener('click', () => {
            console.log('Sidebar close button clicked');
             if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                document.body.classList.remove('sidebar-open');
             }
        });
    }

    // Sidebar navigation
    const sidebarLinks = sidebar.querySelectorAll('nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            console.log('Navigating to:', targetId);
            
            // Map the href to the correct section ID
            const sectionMap = {
                'cardManagement': 'cardManagement',
                'flashcard': 'flashcard',
                'statistics': 'statistics',
                'studyGoals': 'studyGoals',
                'cardChanges': 'cardChanges',
                'socialShare': 'socialShare'
            };
            
            const targetSection = document.getElementById(sectionMap[targetId]);
            console.log('Target section:', targetSection);
            
            if (targetSection) {
                targetSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close sidebar on mobile after clicking
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    document.body.classList.remove('sidebar-open');
                }
            } else {
                console.error('Section not found:', targetId);
            }
        });
    });

    // Sidebar help button
    if (helpBtnSidebar) {
        helpBtnSidebar.addEventListener('click', () => {
            console.log('Sidebar help button clicked');
            shortcutsModal.classList.remove('hidden');
            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                document.body.classList.remove('sidebar-open');
            }
        });
    }

    // Sidebar reset button
    if (resetAllBtnSidebar) {
        resetAllBtnSidebar.addEventListener('click', () => {
            console.log('Sidebar reset button clicked');
            if (confirm('Are you sure you want to reset all data? This will delete all cards and statistics.')) {
                // Reset all data
                cardData = [];
                currentCardIndex = 0;
                isFlipped = false;
                reviewedCards = 0;
                masteredCards = 0;
                studyStartTime = new Date();
                sessionStats = {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    failedCards: []
                };
                
                // Clear recent changes
                addedCards = [];
                editedCards = [];
                
                // Clear localStorage
                localStorage.removeItem('flashcards');
                localStorage.removeItem('addedCards');
                localStorage.removeItem('editedCards');
                
                // Reset UI
                loadCards();
                updateStats();
                showAnalysisBtn.classList.add('hidden');
                
                // Reset recent changes section
                document.getElementById('addedCardsList').innerHTML = '<div class="text-sm text-gray-600 dark:text-gray-400 italic">No cards added yet</div>';
                document.getElementById('editedCardsList').innerHTML = '<div class="text-sm text-gray-600 dark:text-gray-400 italic">No cards edited yet</div>';
                
                showToast('All data has been reset!');
            }
            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                document.body.classList.remove('sidebar-open');
            }
        });
    }
});