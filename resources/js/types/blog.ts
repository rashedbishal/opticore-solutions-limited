import type React from 'react';

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    image: string;
    author: string;
    date: string;
    readTime: string;
    content: string | React.ReactNode;
}

export type BlogCategory = string;
