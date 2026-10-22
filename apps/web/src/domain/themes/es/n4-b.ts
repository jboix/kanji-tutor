/** Spanish texts for N4 units 17–19 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N4_B: ById<UnitText> = {
  'part-time-job': {
    theme: 'Un trabajo a tiempo parcial',
    summary:
      'Los estudiantes trabajan a tiempo parcial en cafeterías y tiendas, donde las fórmulas de cortesía se aprenden el primer día.',
    sentences: [
      'Trabajo a tiempo parcial tres veces por semana en una cafetería delante de la estación.',
      'Me pagan 1.100 yenes la hora.',
      'Al principio, las palabras que se usan con los clientes eran difíciles y me costó mucho.',
      'Practiqué todos los días saludos como “Bienvenido”.',
      'El encargado es amable y me explica con cuidado todo lo que no entiendo.',
      'Para no llegar nunca tarde, siempre procuro llegar diez minutos antes.',
      'Desde que empecé a trabajar, hablo mejor japonés.',
      'Pienso comprarme una computadora nueva con el sueldo del mes que viene.',
    ],
    questions: [
      'Línea 1: 一週間に三回, tres veces por semana.',
      'En la línea 3, 大変 sigue a 難しくて: el lenguaje con los clientes era difícil, así que al principio el trabajo no fue fácil. No se dice nada de que el sueldo sea bajo ni de que haya pocos clientes.',
      'Línea 6: ちこくしないように, “para no llegar tarde”. Del encargado se dice que es amable, no que dé esa orden.',
      'Línea 8: 来月のきゅうりょうで、新しいパソコンを買うつもりです. El texto no habla de ningún viaje, ni de enviar dinero a la familia, ni de pagar la escuela.',
    ],
  },
  'at-the-clinic': {
    theme: 'Ir al médico',
    summary:
      'Las clínicas del barrio te atienden sin cita: lleva tu tarjeta del seguro y espera tu turno.',
    sentences: [
      'El lunes pasado, al levantarme, tenía fiebre y me dolía la cabeza.',
      'También me dolía la garganta, así que no fui a clase y fui a una clínica cercana.',
      'En recepción entregué mi tarjeta del seguro médico y escribí mi nombre.',
      'Después de esperar unos treinta minutos, me vio el médico.',
      'El médico dijo: “Es un resfriado. Tómate esta medicina tres veces al día”.',
      'También dijo: “No te esfuerces demasiado; deberías descansar dos o tres días”.',
      'Tomé la medicina, dormí bien y a los tres días ya estaba curado.',
    ],
    questions: [
      'Línea 3: 受付でほけんのカードを出して、名前を書きました: el autor enseñó la tarjeta del seguro y escribió su nombre. La consulta con el médico vino después de la espera, el medicamento lo dio el médico, y no se menciona ninguna inyección.',
      'Línea 5: この薬を一日三回飲んでください. El 二、三日 de la línea 6 es el número de días de descanso.',
      'Línea 6: 無理をしないで、二、三日休んだほうがいい. El médico nunca pide visitas diarias ni una inyección.',
      'Línea 7: 三日後には治りました.',
    ],
  },
  shinkansen: {
    theme: 'Viajar en tren bala',
    summary:
      'El shinkansen es rápido y famoso por su puntualidad, y el bento de estación forma parte del viaje.',
    sentences: [
      'En las vacaciones de primavera viajé de Tokio a Kioto en shinkansen.',
      'Había reservado un asiento el día anterior.',
      'Era un asiento junto a la ventana, así que se veía bien el paisaje.',
      'El shinkansen es muy rápido; hasta Kioto tardó solo algo más de dos horas.',
      'En el tren comí un bento de estación y miré el monte Fuji por la ventana.',
      'Dicen que el shinkansen casi nunca se retrasa, y eso suele sorprender a los visitantes extranjeros.',
      'Llegamos a la estación de Kioto a la hora exacta.',
    ],
    questions: [
      'Línea 2: 前の日に、指定席を予約しておきました. 〜ておく indica que se hizo de antemano.',
      'Línea 3: 窓の近くの席だったので: el asiento estaba junto a la ventana (窓に近い). No se habla del tiempo, nada dice que el tren estuviera vacío, y era rápido, no lento.',
      'Línea 6: ほとんど遅れない, así que casi siempre llega a su hora, y la línea 7 muestra que llegó 予定の時間ちょうど. El viaje duró algo más de dos horas (línea 4), y el autor comió un bento a bordo (línea 5).',
    ],
  },
};
