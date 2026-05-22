'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header style={{
      height: 60,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      background: '#ffffff',
      borderBottom: '1px solid #e8e5de',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <Image
          src="/assets/logo.svg"
          alt="MeetLog"
          width={120}
          height={36}
          priority
        />
      </Link>
    </header>
  );
}
