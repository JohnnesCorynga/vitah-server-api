const express = require('express');
const { queryDb } = require('../../models/db');
const router = express.Router();

// Rota para mapear tipos de turnos
router.post('/map', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_shifts
            WHERE is_active = 1
            ORDER BY tp_shift ASC;
        `;
        const results = await queryDb(SQL);

        // Criar dois arrays: um para cd_sequence e outro para tp_shift
        const cdSequenceArray = results.map(item => item.cd_sequence);
        const labelsArray = results.map(item => item.tp_shift);

        // Retornar ambos os arrays
        return res.status(200).json({
            cdSequenceArray,
            labelsArray
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter os tipos de turno. Tente novamente mais tarde." });
    }
});

// Rota para obter todos os tipos de turnos
router.post('/all', async (req, res) => {
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_shifts
            WHERE is_active = 1
            ORDER BY tp_shift ASC;
        `;
        const results = await queryDb(SQL);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "Erro ao obter os tipos de turno. Tente novamente mais tarde." });
    }
});

// Rota para obter um tipo de turno por ID
router.post('/unic', async (req, res) => {
    const { cdSequence } = req.body;
    if (!cdSequence) {
        return res.status(422).json({ message: 'O código do tipo de turno é obrigatório!' });
    }
    try {
        const SQL = `
            SELECT * 
            FROM tb_seg_shifts
            WHERE cd_sequence = $1;
        `;
        const results = await queryDb(SQL, [cdSequence]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tipo de turno não encontrado!' });
        }
        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar o tipo de turno. Tente novamente mais tarde." });
    }
});


// Rota para criar um novo tipo de turno
router.post('/create', async (req, res) => {

    try {
        const { tpShift, hrStart, hrEnd, dsShift, } = req.body;

        // Verifica se todos os campos obrigatórios estão preenchidos
        if (!tpShift || !hrStart || !hrEnd || !dsShift) {
            return res.status(422).json({ message: 'Todos os campos são obrigatórios!' });
        }

        // Verifica se já existe um turno com o mesmo tipo ativo ou os mesmos horários
        const conflictCheck = await queryDb(
            `SELECT * 
             FROM tb_seg_shifts 
             WHERE (LOWER(tp_shift) = LOWER($1) OR (hr_start = $2 AND hr_end = $3)) 
               AND is_active = 1`,
            [tpShift, hrStart, hrEnd]
        );

        if (conflictCheck.length > 0) {
            // Identifica se o conflito foi de tipo de turno ou de horários
            const conflict = conflictCheck[0];
            if (conflict.tp_shift.toLowerCase() === tpShift.toLowerCase()) {
                return res.status(422).json({ message: 'Este tipo de turno já está cadastrado!' });
            }
            if (conflict.hr_start === hrStart && conflict.hr_end === hrEnd) {
                return res.status(422).json({ message: 'Já existe um turno com esses horários!' });
            }
        }

        // Insere o novo turno no banco de dados
        const SQL = `
            INSERT INTO tb_seg_shifts (tp_shift, hr_start, hr_end, ds_shift, is_active)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await queryDb(SQL, [tpShift, hrStart, hrEnd, dsShift, 1]);

        return res.status(201).json({ message: 'Tipo de turno criado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar o tipo de turno. Tente novamente mais tarde.' });
    }

});

// Rota para atualizar um tipo de turno
router.post('/update', async (req, res) => {
    try {
        const { cdSequence, tpShift, hrStart, hrEnd, dsShift, isActive } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de turno é obrigatório!' });
        }

        if (!tpShift || !hrStart || !hrEnd) {
            return res.status(422).json({ message: 'Todos os campos são obrigatórios!' });
        }

          // Verifica se já existe um turno com o mesmo tipo ativo ou os mesmos horários
        const conflictCheck = await queryDb(
            `
                SELECT * 
                FROM tb_seg_shifts 
                WHERE 
                    (LOWER(tp_shift) = LOWER($1) 
                    OR (hr_start = $2 AND hr_end = $3)) 
                    AND cd_sequence != $4
               AND is_active = 1
            `,
            [tpShift, hrStart, hrEnd,cdSequence]
        );

        if (conflictCheck.length > 0) {
            // Identifica se o conflito foi de tipo de turno ou de horários
            const conflict = conflictCheck[0];
            if (conflict.tp_shift.toLowerCase() === tpShift.toLowerCase()) {
                return res.status(422).json({ message: 'Este tipo de turno já está cadastrado!' });
            }
            if (conflict.hr_start === hrStart && conflict.hr_end === hrEnd) {
                return res.status(422).json({ message: 'Já existe um turno com esses horários!' });
            }
        }


        const SQL = `
            UPDATE tb_seg_shifts
            SET 
                tp_shift = COALESCE($1, tp_shift),
                hr_start = COALESCE($2, hr_start),
                hr_end = COALESCE($3, hr_end),
                ds_shift = COALESCE($4, ds_shift),
                dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $5
        `;
        await queryDb(SQL, [tpShift, hrStart, hrEnd, dsShift,cdSequence]);

        return res.status(200).json({ message: 'Tipo de turno atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar o tipo de turno. Tente novamente mais tarde.' });
    }
});

// Rota para excluir um tipo de turno
router.post('/delete', async (req, res) => {
    try {
        const { cdSequence } = req.body;

        if (!cdSequence) {
            return res.status(422).json({ message: 'O código do tipo de turno é obrigatório!' });
        }
        const typeExists = await queryDb(
            `SELECT * FROM tb_seg_shifts WHERE cd_sequence = $1 AND is_active = 1`,
            [cdSequence]
        );

        if (typeExists.length == 0) {
            return res.status(422).json({ message: 'Este tipo de turno não encontrado!' });
        }
        const SQL = `
            UPDATE tb_seg_shifts
            SET is_active = 0,
            dt_update = CURRENT_TIMESTAMP
            WHERE cd_sequence = $1;
        `;
        await queryDb(SQL, [cdSequence]);
        return res.status(200).json({ message: "Tipo de turno excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o tipo de turno. Tente novamente mais tarde." });
    }
});

module.exports = router;
