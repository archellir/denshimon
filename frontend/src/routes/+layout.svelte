<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import Navigation from '$lib/components/Navigation.svelte';
	import Header from '$lib/components/Header.svelte';

	onMount(() => {
		// Check if user is authenticated on app load
		authStore.checkAuth();
	});

	$: isLoginPage = $page.route.id === '/login';
	$: requiresAuth = !isLoginPage;

	// Redirect to login if not authenticated
	$: if (requiresAuth && !$authStore.isAuthenticated && $authStore.initialized) {
		goto('/login');
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	{#if $authStore.isAuthenticated}
		<div class="flex h-screen">
			<!-- Sidebar Navigation -->
			<Navigation />
			
			<!-- Main Content -->
			<div class="flex-1 flex flex-col overflow-hidden">
				<Header />
				
				<main class="flex-1 overflow-y-auto p-6">
					<slot />
				</main>
			</div>
		</div>
	{:else if isLoginPage}
		<slot />
	{:else}
		<!-- Loading state while checking auth -->
		<div class="flex items-center justify-center min-h-screen">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-kubernetes-600"></div>
		</div>
	{/if}
</div>