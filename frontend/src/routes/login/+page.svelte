<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { Server } from 'lucide-svelte';

	let username = '';
	let password = '';
	let loading = false;
	let error = '';

	async function handleLogin() {
		if (!username || !password) {
			error = 'Please enter both username and password';
			return;
		}

		loading = true;
		error = '';

		try {
			await authStore.login(username, password);
			goto('/');
		} catch (err: any) {
			error = err.message || 'Login failed';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<svelte:head>
	<title>Login - K8s WebUI</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-kubernetes-100 dark:bg-kubernetes-900">
				<Server class="h-8 w-8 text-kubernetes-600 dark:text-kubernetes-400" />
			</div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
				K8s WebUI
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
				Sign in to manage your Kubernetes infrastructure
			</p>
		</div>
		
		<form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
			<div class="space-y-4">
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Username
					</label>
					<input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						required
						bind:value={username}
						on:keydown={handleKeydown}
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-kubernetes-500 focus:border-kubernetes-500 focus:z-10 sm:text-sm"
						placeholder="Enter your username"
					/>
				</div>
				
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						bind:value={password}
						on:keydown={handleKeydown}
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-kubernetes-500 focus:border-kubernetes-500 focus:z-10 sm:text-sm"
						placeholder="Enter your password"
					/>
				</div>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 dark:bg-red-900 p-4">
					<div class="text-sm text-red-700 dark:text-red-200">
						{error}
					</div>
				</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-kubernetes-600 hover:bg-kubernetes-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kubernetes-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
					{/if}
					Sign in
				</button>
			</div>

			<div class="text-center">
				<p class="text-xs text-gray-500 dark:text-gray-400">
					Demo credentials: admin / admin
				</p>
			</div>
		</form>
	</div>
</div>