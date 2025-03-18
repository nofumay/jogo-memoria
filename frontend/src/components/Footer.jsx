import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>Jogo de Memória © {new Date().getFullYear()}</p>
        <p>Criado por <span className="creator-name">Diego Silva</span></p>
      </div>
    </footer>
  );
};

export default Footer;