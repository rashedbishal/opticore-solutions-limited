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

const ForgotPasswordPage = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4">
            <Card className="w-full max-w-md border-white/10 bg-gray-900/70 shadow-xl shadow-black/30 backdrop-blur-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-white">
                        Forgot Password?
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Enter your email and we'll send you instructions to
                        reset it.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
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
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-700"
                        >
                            Send Reset Link
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-gray-400">
                        Remembered your password?{' '}
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

export default ForgotPasswordPage;
