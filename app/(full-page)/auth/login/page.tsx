/* eslint-disable max-len */
"use client"
import { Button } from "primereact/button"
import { Checkbox } from "primereact/checkbox"
import { InputText } from "primereact/inputtext"
import { useState, useEffect } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import {
  AuthService as _auth
} from "@/shared/services"
import { useToast } from "@/shared/context/toast/toastContext"
import { createCookieToken, setToken } from "@/shared/utilities/functions/sessionUtils"
import { usePush } from "@/shared/hooks/usePush"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import Image from "next/image"
import LOGO from "../../../../assets/resources/layout_logo_nuvoox_orange.svg"
const ES_LOGIN = {
  login: {
    title: "Inicio de Sesión",
    pleaseInsert: "Por favor ingrese sus credenciales",
    placeholder: {
      email: "Ingrese su correo electrónico",
      password: "Ingrese su contraseña"
    },
    showPassword: "Mostrar contraseña",
    forgotPassword: "¿Olvidó su contraseña?",
    buttons: {
      login: "Iniciar Sesión"
    }
  },
  common: {
    generalMessage: {
      errorLogin: "Error al iniciar sesión",
      logged: "Sesión iniciada correctamente",
      welcomeNamed: "Bienvenido, "
    }

  }
}

const Login = () => {
  // Todos los hooks deben estar en el nivel superior
  const [mounted, setMounted] = useState(false);
  const [showPass, setshowPass] = useState(false);
  const { showSuccessMany, showError, showSuccess } = useToast();
  const { onClickAction } = usePush(ADMIN_ROUTES.DASHBOARD);
  const { register, handleSubmit, formState: { errors }, getValues } = useForm<any>({
    defaultValues: {
      email: "",
      password: ""
    }
  });
  
  // Efecto para manejar la hidratación
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Retorno condicional después de todos los hooks
  if (!mounted) return null;

  const onSubmit: SubmitHandler<any> = async (data) => {
    try {
      const authUser = {
        mail: data.email,
        password: data.password
      }
      console.log(authUser)
      await _auth.login(authUser).then(
        (res) => {
          if (res.status === 201) {
            if (!res.data.token) {
              showError(ES_LOGIN.common.generalMessage.errorLogin)
              return
            }
            setToken(res.data.token) // Agrega el token al session storage
            createCookieToken(res.data.token) // Agrega el token a la cookie
            onClickAction() // Redirige a la página principal del administrador
            showSuccessMany([ES_LOGIN.common.generalMessage.logged, `${ES_LOGIN.common.generalMessage.welcomeNamed} ${res.data.user.name}`])
          } else {
            showError(ES_LOGIN.common.generalMessage.errorLogin)
          }
        }
      ).catch((error : any) => {
        showError(error.response?.data?.error)
      })
    } catch (error : any) {
      alert(error)
    }
  }

  function recoverPassword () {
    // obtener el email del input
    const email = getValues("email")
    if (email === "") {
      showError("Por favor ingrese su correo electrónico")
      return
    }
    _auth.recover(email).then(
      (res) => {
        if (res.status === 200) {
          showSuccess("Si un usuario en el correo asociado se enviara su contraseña")
        }
      }
    ).catch((error : any) => {
      showError(error.response?.data?.error)
    })
  }

  const dark = false

  return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <svg xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1600 800" className="fixed left-0 top-0 min-h-screen min-w-screen" preserveAspectRatio="none">
                <rect fill={dark ? "var(--primary-900)" : "var(--primary-500)"} width="1600" height="800" />
                <path
                    fill={dark ? "var(--primary-800)" : "var(--primary-400)"}
                    d="M478.4 581c3.2 0.8 6.4 1.7 9.5 2.5c196.2 52.5 388.7 133.5 593.5
                    176.6c174.2 36.6 349.5 29.2 518.6-10.2V0H0v574.9c52.3-17.6 106.5-27.7 161.1-30.9C268.4 537.4 375.7 554.2 478.4 581z"
                    />

                <path
                    fill={dark ? "var(--primary-700)" : "var(--primary-300)"}
                    d="M181.8 259.4c98.2 6 191.9 35.2 281.3 72.1c2.8 1.1 5.5 2.3 8.3 3.4c171 71.6 342.7
                     158.5 531.3 207.7c198.8 51.8 403.4 40.8 597.3-14.8V0H0v283.2C59 263.6 120.6 255.7 181.8 259.4z"
                />
            </svg>
            <div className="px-5 min-h-screen flex justify-content-center align-items-center">
                <div className="border-1 surface-border surface-card border-round py-7 px-4 md:px-7 z-1">
                    <div className="flex justify-content-center z-1 mb-6">
                        <Image src={LOGO} alt='imagen de Renting' width={196} height={48}/>
                    </div>
                    <div className="mb-4">
                        <div className="text-900 text-xl font-bold mb-2">{ES_LOGIN.login.title}</div>
                        <span className="text-600 font-medium">{ES_LOGIN.login.pleaseInsert}</span>
                    </div>
                    <div className="flex flex-column">
                        <div className="p-inputgroup mb-4">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-envelope"></i>
                            </span>
                            <div className="flex flex-column w-25rem">
                            <InputText id="email" type="text" className="w-full md:w-25rem"
                                {...register("email")} placeholder={ES_LOGIN.login.placeholder.email} />
                            </div>
                        </div>

                        <div className="p-inputgroup mb-4">
                            <span className="p-inputgroup-addon">
                                <i className={`pi pi-${!showPass ? "lock" : "lock-open"}`}></i>
                            </span>
                            <div className="flex flex-column w-25rem">
                                <InputText id="password" type={showPass ? "text" : "password"} className="w-full md:w-25rem"
                                    {...register("password")} placeholder={ES_LOGIN.login.placeholder.password} />

                                {errors.password && <></>
                                }
                            </div>
                        </div>
                        <div className="mb-4 flex flex-wrap gap-3">
                            <div>
                                <Checkbox name="checkbox"
                                    checked={showPass}
                                    onChange={(e) => setshowPass(e.checked ?? false)} className="mr-2"></Checkbox>
                                <label htmlFor="checkbox" onClick={() => setshowPass(!showPass)} className="text-900 font-medium mr-8">
                                    {ES_LOGIN.login.showPassword}
                                </label>
                            </div>
                            <a onClick={() => recoverPassword()} href="#"
                            className="text-600 cursor-pointer hover:text-primary cursor-pointer
                                        ml-auto transition-colors transition-duration-300">
                                {ES_LOGIN.login.forgotPassword}
                            </a>
                        </div>
                        <Button label={ES_LOGIN.login.buttons.login} className="w-full" ></Button>
                    </div>
                </div>
                </div>
        </form>
  )
}

export default Login
