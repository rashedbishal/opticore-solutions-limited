import type React from 'react';

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    description: string;
    category:
        | 'Graphic Design'
        | 'Digital Marketing'
        | 'Video Editing'
        | '3D Production'
        | 'Web Development';
    image: string;
    author: string;
    date: string;
    readTime: string;
    content: string | React.ReactNode;
}

export type BlogCategory = BlogPost['category'] | 'All';
