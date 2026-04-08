import React from 'react';

interface Props {
  message?: string;
}

import '../styles/Loading.css';
const Loading: React.FC<Props> = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-outer">
      <svg className="papers" width="96" height="80" viewBox="0 0 96 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="8" y="12" width="72" height="52" rx="6" fill="#fff" stroke="#e3eafc" strokeWidth="2" />
        <rect x="14" y="6" width="72" height="52" rx="6" fill="#fff" stroke="#e3eafc" strokeWidth="2" opacity="0.9" transform="rotate(-6 14 6)" />
        <rect x="2" y="18" width="72" height="52" rx="6" fill="#fff" stroke="#e3eafc" strokeWidth="2" opacity="0.95" transform="rotate(6 2 18)" />
        <g fill="#607d8b" opacity="0.9">
          <rect x="22" y="28" width="44" height="6" rx="3" />
          <rect x="22" y="38" width="32" height="6" rx="3" />
        </g>
      </svg>
      <div className="loading-message">{message}</div>
    </div>
  );
};

export default Loading;
