import { Link } from '@inertiajs/react';
import React from 'react';
import { Button } from '@/components/UI/Button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';

const SignUpPage = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4">
            <Card className="w-full max-w-md border-white/10 bg-gray-900/70 shadow-xl shadow-black/30 backdrop-blur-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-white">
                        Create Account
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Join us to unlock exclusive features.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div>
                            <Label htmlFor="name" className="text-gray-300">
                                Name
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your Name"
                                className="mt-1 border-gray-700 bg-gray-800/50"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email" className="text-gray-300">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                className="mt-1 border-gray-700 bg-gray-800/50"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-gray-300">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                className="mt-1 border-gray-700 bg-gray-800/50"
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="password_confirmation"
                                className="text-gray-300"
                            >
                                Confirm Password
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                placeholder="********"
                                className="mt-1 border-gray-700 bg-gray-800/50"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-700"
                        >
                            Sign Up
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-violet-400 hover:underline"
                        >
                            Log In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SignUpPage;
