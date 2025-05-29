<template>
    <div class="flex flex-col min-h-screen">
        <CommonHeaders />
        <div class="w-full h-1 bg-primary-500 dark:bg-primary-600"/>
        <main class="flex-1">   
            <slot />
        </main>
        <div class="w-full h-1 bg-primary-500 dark:bg-primary-600"/>
        <CommonFooter />
    </div>
</template>