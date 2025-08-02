<script lang="ts">
	import { page } from '$app/stores';
	import { 
		Home, 
		Server, 
		Database, 
		Network,
		Settings,
		Activity,
		Globe
	} from 'lucide-svelte';

	const navigation = [
		{
			name: 'Dashboard',
			href: '/',
			icon: Home
		},
		{
			name: 'Infrastructure',
			href: '/infrastructure',
			icon: Server
		},
		{
			name: 'Cluster',
			href: '/cluster',
			icon: Database
		},
		{
			name: 'Networking',
			href: '/networking',
			icon: Network
		},
		{
			name: 'Domains',
			href: '/domains',
			icon: Globe
		},
		{
			name: 'Monitoring',
			href: '/monitoring',
			icon: Activity
		},
		{
			name: 'Settings',
			href: '/settings',
			icon: Settings
		}
	];

	$: currentPath = $page.url.pathname;
</script>

<nav class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 flex-shrink-0">
	<div class="p-6">
		<div class="flex items-center space-x-2">
			<div class="h-8 w-8 bg-kubernetes-600 rounded-lg flex items-center justify-center">
				<Server class="h-5 w-5 text-white" />
			</div>
			<div>
				<h1 class="text-lg font-semibold text-gray-900 dark:text-white">K8s WebUI</h1>
				<p class="text-xs text-gray-500 dark:text-gray-400">Infrastructure Management</p>
			</div>
		</div>
	</div>

	<div class="px-3 pb-6">
		<nav class="space-y-1">
			{#each navigation as item}
				<a
					href={item.href}
					class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
						{currentPath === item.href
							? 'bg-kubernetes-50 dark:bg-kubernetes-900 text-kubernetes-700 dark:text-kubernetes-200 border-r-2 border-kubernetes-600'
							: 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
						}"
				>
					<svelte:component 
						this={item.icon} 
						class="mr-3 h-5 w-5 {currentPath === item.href ? 'text-kubernetes-600 dark:text-kubernetes-400' : 'text-gray-400 group-hover:text-gray-500'}" 
					/>
					{item.name}
				</a>
			{/each}
		</nav>
	</div>
</nav>