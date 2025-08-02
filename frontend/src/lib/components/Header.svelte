<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { websocketStore } from '$lib/stores/websocket';
	import { LogOut, Wifi, WifiOff, User } from 'lucide-svelte';

	async function handleLogout() {
		await authStore.logout();
	}
</script>

<header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
				base-infrastructure
			</h2>
			<div class="flex items-center space-x-2">
				{#if $websocketStore.connected}
					<div class="flex items-center space-x-1 text-green-600 dark:text-green-400">
						<Wifi class="h-4 w-4" />
						<span class="text-xs font-medium">Connected</span>
					</div>
				{:else if $websocketStore.reconnecting}
					<div class="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
						<div class="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
						<span class="text-xs font-medium">Reconnecting...</span>
					</div>
				{:else}
					<div class="flex items-center space-x-1 text-red-600 dark:text-red-400">
						<WifiOff class="h-4 w-4" />
						<span class="text-xs font-medium">Disconnected</span>
					</div>
				{/if}
			</div>
		</div>

		<div class="flex items-center space-x-4">
			<!-- User Info -->
			<div class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
				<User class="h-4 w-4" />
				<span>{$authStore.user?.username}</span>
				<span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
					{$authStore.user?.role}
				</span>
			</div>

			<!-- Logout Button -->
			<button
				on:click={handleLogout}
				class="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
			>
				<LogOut class="h-4 w-4" />
				<span>Logout</span>
			</button>
		</div>
	</div>
</header>