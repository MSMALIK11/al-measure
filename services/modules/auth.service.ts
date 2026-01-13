import apiService  from '../http'

export const  authService={
    async signin(payload:any){
        const response=await apiService.post('/auth/signin',payload)
        return response.data
    }
}

