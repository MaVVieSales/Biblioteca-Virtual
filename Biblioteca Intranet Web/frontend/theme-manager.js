const ThemeManager = {
    STORAGE_KEY: 'biblioteca-virtual-theme',
    
    init() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'light';
        
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark-mode');
            document.body.classList.add('dark-mode');
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.updateIcon();
            });
        } else {
            this.updateIcon();
        }
    },
    
    toggle() {
        const isDark = document.body.classList.toggle('dark-mode');
        
        localStorage.setItem(this.STORAGE_KEY, isDark ? 'dark' : 'light');
        
        this.updateIcon();
        

        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: isDark ? 'dark' : 'light' }
        }));
        

        if (typeof window.atualizarTemaGraficos === 'function') {
            window.atualizarTemaGraficos();
        }
    },
    
    updateIcon() {
        const icon = document.getElementById('theme-icon');
        if (!icon) return;
        
        const isDark = document.body.classList.contains('dark-mode');
        
        if (isDark) {
            icon.innerHTML = `
                <circle cx="12" cy="12" r="5" fill="white"/>
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" fill="white"></path>   
            `;
        } else {
            icon.innerHTML = `
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" fill="white"/>
            `;
        }
    },
    
    getCurrentTheme() {
        return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    }
};

ThemeManager.init();

function toggleTheme() {
    ThemeManager.toggle();
}