'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) setUser(username);
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="navbar">

      {/* LEFT USER */}
      <div className="nav-left">
        {user && <span className="username">👤 {user}</span>}
      </div>

      {/* CENTER BUTTONS */}
      <div className="nav-center">

        <Link href="/">
          <button className="cssbuttons-io-button">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span>Home</span>
          </button>
        </Link>

        <Link href="/products">
          <button className="cssbuttons-io-button">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span>Products</span>
          </button>
        </Link>

        <Link href="/cart">
          <button className="cssbuttons-io-button">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span>Cart</span>
          </button>
        </Link>

      </div>

      {/* RIGHT */}
      <div className="nav-right">

        <Link href="/" className="shopflow-btn">
          ShopFlow
          <div className="arrow-wrapper">
            <div className="arrow"></div>
          </div>
        </Link>

        {user && (
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        )}
      </div>

    </div>
  );
}