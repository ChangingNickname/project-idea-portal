export {}

declare global {
    interface User {
        id: string
        email: string | null
        avatar: string | null
        emailVerified: boolean
        displayName: string | null
        phoneNumber: string | null
        disabled: boolean
        isAnonymous: boolean
        providerData: ProviderData[]
        customClaims: CustomClaims | null
        metadata: Metadata
        tenantId: string | null
        multiFactor: MultiFactor | null
        contacts: UserContacts
    }

    interface UserContacts {
        email: string | null
        phone: string | null
        telegram: string | null
        whatsapp: string | null
        viber: string | null
        discord: string | null
        linkedin: string | null
        github: string | null
        website: string | null
    }

    interface ProviderData {
        providerId: string
        uid: string
        displayName: string | null
        email: string | null
        phoneNumber: string | null
        photoURL: string | null
    }

    interface CustomClaims {
        [key: string]: any
    }

    interface Metadata {
        creationTime: string | null
        lastSignInTime: string | null
        lastRefreshTime: string | null
    }

    interface MultiFactor {
        enrolledFactors: MultiFactorEnrolledFactor[]
    }

    interface MultiFactorEnrolledFactor {
        uid: string
        factorId: string
        displayName: string | null
        enrollmentTime: string | null
    }
}
