// Mobile Menu Toggle Script
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (mobileMenuBtn && sidebar && mobileOverlay) {
        // Ensure sidebar is closed on page load
        sidebar.classList.remove('show');
        mobileOverlay.classList.remove('show');
        
        mobileMenuBtn.addEventListener('click', function() {
            const isOpen = sidebar.classList.contains('show');
            if (isOpen) {
                sidebar.classList.remove('show');
                mobileOverlay.classList.remove('show');
            } else {
                sidebar.classList.add('show');
                mobileOverlay.classList.add('show');
            }
        });
        
        mobileOverlay.addEventListener('click', function() {
            sidebar.classList.remove('show');
            mobileOverlay.classList.remove('show');
        });
        
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', function() {
                sidebar.classList.remove('show');
                mobileOverlay.classList.remove('show');
            });
        });
    }
});
